# ITU × PUBGM Supremacy Cup — Complete Data Flow

> Every request, database write, cookie, and Cloudinary upload explained end-to-end.

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Request Lifecycle (every page load)](#2-request-lifecycle-every-page-load)
3. [Registration Flow (Email + OTP)](#3-registration-flow-email--otp)
4. [Login Flow — Email/Password](#4-login-flow--emailpassword)
5. [Login Flow — Google OAuth](#5-login-flow--google-oauth)
6. [Complete Profile Flow](#6-complete-profile-flow)
7. [Image Upload Flow (with Compression)](#7-image-upload-flow-with-compression)
8. [Team Creation Flow](#8-team-creation-flow)
9. [Join Team Flow](#9-join-team-flow)
10. [Admin Panel Access](#10-admin-panel-access)
11. [Admin: Assign Role / Promote Admin](#11-admin-assign-role--promote-admin)
12. [Community Members Management](#12-community-members-management)
13. [Password Change Flow](#13-password-change-flow)
14. [Session & JWT Internals](#14-session--jwt-internals)
15. [Database Collections Reference](#15-database-collections-reference)
16. [Where Each Piece of Data Lives](#16-where-each-piece-of-data-lives)

---

## 1. System Architecture Overview

```
Browser
  │
  ├─ Static assets (HTML/CSS/JS) ──────────────────► Vercel CDN
  │
  ├─ Page requests (SSR) ──────────────────────────► Vercel Serverless Function
  │    └─ Server Component reads auth() from JWT cookie
  │
  ├─ API calls (/api/...) ─────────────────────────► Vercel Serverless Function
  │    └─ Connects to MongoDB Atlas
  │
  ├─ Image uploads ────────────────────────────────► Cloudinary (directly)
  │    └─ Signed URL first fetched from /api/upload
  │
  └─ Emails (OTP, welcome) ────────────────────────► Resend → User's inbox
```

**Key services and what they store:**

| Service | Stores |
|---|---|
| **MongoDB Atlas** | All application data: users, teams, join requests, announcements, gallery metadata, notifications, OTP tokens, stats, etc. |
| **Cloudinary** | Actual image/video files: profile photos, team logos, gallery media. MongoDB only stores the Cloudinary URL. |
| **Resend** | Nothing stored — sends transactional emails only (OTP codes, welcome emails). |
| **Vercel** | Hosts the Next.js app. No persistent storage of its own. |
| **JWT Cookie** | Session token stored in the browser. Contains: userId, role, permissions, profileCompleted, teamId. Signed with AUTH_SECRET. |

---

## 2. Request Lifecycle (every page load)

Every time a browser navigates to any page:

```
Browser navigates to /some-page
        │
        ▼
  proxy.ts (Next.js 16 middleware — Edge runtime, runs BEFORE the page)
        │
        ├─ Reads JWT cookie from request headers
        ├─ Verifies JWT signature using AUTH_SECRET
        ├─ Calls authorized() callback from auth.config.ts:
        │
        │   /admin/*  ──► requires role = "admin" | "super_admin"
        │                  → if fails: redirect to /login?callbackUrl=/admin/...
        │
        │   /profile  ──► requires authenticated user
        │   /teams/create ► requires authenticated user
        │                  → if fails: redirect to /login
        │
        │   everything else → allowed (public)
        │
        ▼
  Next.js renders the page (Server Component)
        │
        ├─ Server Component calls auth() to get full session object
        │   auth() reads the same JWT cookie, returns:
        │   { user: { id, email, name, role, permissions, profileCompleted, teamId, ... } }
        │
        ├─ Page uses session to decide what to render
        │   (show "Admin Panel" link, show edit button, etc.)
        │
        └─ HTML sent to browser
```

**No database is hit during middleware** — it's purely JWT verification (Edge runtime, no Mongoose allowed).

---

## 3. Registration Flow (Email + OTP)

```
User fills /register form
```

### Step 1 — Send OTP

```
Browser → POST /api/otp/send  { email: "user@example.com" }
                │
                ▼
        connectDB() → MongoDB Atlas
                │
                ├─ Rate limit check:
                │   OTPToken.countDocuments({ email, createdAt: { $gte: 1hr ago } })
                │   If >= 3 → return 429 "Too many requests"
                │
                ├─ Generate 6-digit code: Math.random()
                ├─ bcrypt.hash(otp, 10)  → hashed OTP
                │
                ├─ OTPToken.create({
                │     email,
                │     otp: hashedOTP,
                │     expiresAt: now + 10 minutes,
                │     isUsed: false,
                │     attempts: 0
                │   })
                │   → Written to MongoDB: otptokens collection
                │
                ├─ MongoDB TTL index auto-deletes this doc after expiresAt
                │
                └─ resend.emails.send(...)
                    → Resend API → User's email inbox
                    (Contains the plain 6-digit OTP)

Browser ← { success: true }
```

### Step 2 — Verify OTP + Create Account

```
Browser → POST /api/otp/verify  { email, otp: "123456", password: "..." }
                │
                ▼
        connectDB() → MongoDB Atlas
                │
                ├─ OTPToken.findOne({
                │     email,
                │     isUsed: false,
                │     expiresAt: { $gt: now }
                │   }).sort({ createdAt: -1 })
                │   → Gets most recent valid token
                │   If none → return 400 "OTP expired"
                │
                ├─ If token.attempts >= 3:
                │   token.isUsed = true → save
                │   → return 400 "Too many attempts"
                │
                ├─ bcrypt.compare(otp, token.otp)
                │   If wrong:
                │     token.attempts += 1 → save to MongoDB
                │     → return 400 "Invalid OTP, X attempts remaining"
                │
                ├─ OTP is correct:
                │   token.isUsed = true → save to MongoDB
                │
                ├─ bcrypt.hash(password, 12) → hashed password
                │
                ├─ User.create({
                │     email,
                │     password: hashedPassword,  ← stored with select:false (never returned in queries)
                │     provider: "credentials",
                │     isEmailVerified: true,
                │     profileCompleted: false,
                │     role: "player",            ← "super_admin" if email matches SUPER_ADMIN_EMAIL
                │     permissions: []
                │   })
                │   → Written to MongoDB: users collection
                │
Browser ← { success: true, userId: "..." }
```

### Step 3 — Auto Sign-In after Registration

```
Browser calls signIn("credentials", { email, password })
  → This is NextAuth's built-in flow → goes to Step 4 below (Login Flow)
  → On success: router.push("/profile?onboarding=true")
```

---

## 4. Login Flow — Email/Password

```
Browser → NextAuth signIn("credentials", { email, password, stayLoggedIn })
                │
                ▼
        NextAuth authorize() callback in auth.ts  (Node.js runtime)
                │
                ├─ connectDB() → MongoDB Atlas
                │
                ├─ User.findOne({ email }).select("+password")
                │   (password field is excluded by default, .select("+password") forces it)
                │
                ├─ If no user or no password → return null → "Invalid credentials"
                │
                ├─ bcrypt.compare(inputPassword, user.password)
                │   If wrong → return null → "Invalid credentials"
                │
                ├─ If !user.isEmailVerified → throw Error("EMAIL_NOT_VERIFIED")
                │   → Browser redirects to /verify-email
                │
                └─ Return user object:
                    { id, email, name, image, role, permissions,
                      profileCompleted, isEmailVerified, teamId, isTeamLeader }
                │
                ▼
        NextAuth jwt() callback
                │
                ├─ Copies all fields from user object into JWT token:
                │   token.id = user.id
                │   token.role = user.role
                │   token.permissions = user.permissions
                │   token.profileCompleted = user.profileCompleted
                │   token.isEmailVerified = user.isEmailVerified
                │   token.teamId = user.teamId
                │   token.isTeamLeader = user.isTeamLeader
                │
                ▼
        NextAuth session() callback
                │
                └─ Maps token fields to session.user:
                    session.user.id = token.id
                    session.user.role = token.role
                    etc.
                │
                ▼
        JWT cookie written to browser
                │
                ├─ Cookie name: "authjs.session-token" (or "__Secure-authjs.session-token" on HTTPS)
                ├─ Signed with AUTH_SECRET (Vercel env var)
                ├─ HttpOnly: true  → JavaScript cannot read it
                ├─ SameSite: Lax
                ├─ Expiry:
                │   stayLoggedIn = true  → 30 days
                │   stayLoggedIn = false → session (until browser closes)
                │
Browser ← Cookie set → router.push("/profile") or callbackUrl
```

---

## 5. Login Flow — Google OAuth

```
Browser → signIn("google", { callbackUrl: "/profile?onboarding=true" })
                │
                ▼
        Redirect to Google's OAuth consent screen
                │
        User approves → Google redirects to:
        /api/auth/callback/google?code=...
                │
                ▼
        NextAuth handles callback internally
                │
                ▼
        NextAuth signIn() callback in auth.ts  (runs BEFORE jwt callback)
                │
                ├─ connectDB() → MongoDB Atlas
                │
                ├─ email = user.email.toLowerCase()
                │   isSuperAdmin = (email === "mohsinrazaojla32@gmail.com")
                │
                ├─ User.findOne({
                │     $or: [{ googleId: account.providerAccountId }, { email }]
                │   })
                │
                ├─ If NO existing user:
                │   User.create({
                │     email,
                │     googleId: account.providerAccountId,
                │     provider: "google",
                │     name: Google profile name,
                │     photo: Google profile picture URL,
                │     isEmailVerified: true,
                │     profileCompleted: isSuperAdmin,  ← super admin skips onboarding
                │     role: isSuperAdmin ? "super_admin" : "player",
                │     permissions: []
                │   })
                │   → Written to MongoDB: users collection
                │
                ├─ If EXISTING user:
                │   updates = {}
                │   If !existing.googleId → updates.googleId = providerAccountId
                │   If isSuperAdmin && role !== "super_admin":
                │     updates.role = "super_admin"      ← auto-fix if role was wrong
                │     updates.profileCompleted = true
                │     updates.isEmailVerified = true
                │   If updates not empty → User.updateOne({ _id }, { $set: updates })
                │   → Written to MongoDB: users collection
                │
                ▼
        NextAuth jwt() callback
                │
                ├─ account.provider === "google" branch:
                │   ├─ Email of super admin? → force-update role in DB if wrong:
                │   │   User.updateOne({ email, role: { $ne: "super_admin" } },
                │   │                  { $set: { role: "super_admin", ... } })
                │   │
                │   └─ User.findOne({ email }) → read full user from DB
                │       token.id = dbUser._id
                │       token.role = dbUser.role
                │       token.permissions = dbUser.permissions
                │       token.profileCompleted = dbUser.profileCompleted
                │       ... etc
                │
                ▼
        JWT cookie written to browser (same as credentials flow above)
                │
Browser ← Cookie set → redirect to callbackUrl
        If !profileCompleted → user sees CompleteProfileForm
```

---

## 6. Complete Profile Flow

Triggered when user navigates to `/profile?onboarding=true` or their profile is incomplete.

```
User fills CompleteProfileForm (name, rollNumber, pubgId, pubgName,
                                gender, semester, degreeProgramme, whatsapp)
        │
        ├─ (Optional) selects photo → goes to Image Upload Flow (Step 7)
        │
        ▼
Browser → PATCH /api/users/me
          { name, rollNumber, pubgId, pubgName, gender, semester,
            degreeProgramme, whatsapp, profileCompleted: true, photo?: "..." }
                │
                ▼
        auth() → reads JWT cookie → gets session.user.id
                │
                ├─ connectDB() → MongoDB Atlas
                │
                ├─ Allowed fields whitelist check
                │   (only: name, rollNumber, pubgId, pubgName, gender, semester,
                │    degreeProgramme, photo, whatsapp, profileCompleted)
                │
                ├─ If rollNumber provided:
                │   User.findOne({ rollNumber, _id: { $ne: session.user.id } })
                │   If exists → return 409 "Roll number already registered"
                │
                └─ User.findByIdAndUpdate(
                       session.user.id,
                       { $set: updates },
                       { new: true, runValidators: true }
                   )
                   → Written to MongoDB: users collection
                   → profileCompleted: true now set

Browser ← { success: true, user: { ...updatedUser } }
        │
        ▼
useSession().update() called → NextAuth re-reads DB and refreshes JWT cookie
        (token.profileCompleted becomes true)
        │
        ▼
router.push("/profile")  → user sees their full profile card
```

---

## 7. Image Upload Flow (with Compression)

Applies to: profile photos (CompleteProfileForm, ProfileEditModal) and team logos (CreateTeamForm).
Does NOT apply to: gallery/memories page.

```
User picks image file in the browser
        │
        ▼
compressImage(file, 200) — runs entirely in the browser (no server call)
        │
        ├─ FileReader reads file as base64 DataURL
        ├─ Creates <img> element, loads the DataURL
        ├─ If image > 1200px on any side → scale down proportionally
        ├─ Draws scaled image onto <canvas>
        ├─ canvas.toBlob(..., "image/jpeg", 0.85)
        ├─ If blob.size > 200KB → reduce quality by 0.1, retry
        ├─ Repeat until size ≤ 200KB OR quality reaches 0.1
        └─ Return new File([blob], "filename.jpg", { type: "image/jpeg" })
        │
        ▼
Browser → POST /api/upload  { folder: "avatars", resourceType: "image" }
                │
                ▼
        auth() → verifies session
                │
                ├─ If folder === "gallery":
                │   requires isSuperAdmin OR hasPermission(MANAGE_GALLERY)
                │   → others get 403
                │
                └─ getSignedUploadParams(folder, resourceType)
                    Uses Cloudinary SDK:
                    cloudinary.utils.api_sign_request({
                      timestamp,
                      folder,
                      upload_preset?
                    }, CLOUDINARY_API_SECRET)

Browser ← { signature, apiKey, timestamp, cloudName, folder }
        │
        ▼
Browser → POST https://api.cloudinary.com/v1_1/{cloudName}/image/upload
          FormData:
            file: <compressed File object>
            api_key: from server
            timestamp: from server
            signature: from server (proves request is authorized)
            folder: "avatars" | "team-logos" | "gallery"
                │
                ▼
        Cloudinary processes and stores the image
        Returns { secure_url: "https://res.cloudinary.com/..." }
        │
        ▼
Browser has the Cloudinary URL
        │
        └─ This URL is then sent to /api/users/me or /api/teams as { photo: url }
           and saved to MongoDB (the URL string, not the image itself)
```

**Summary:** MongoDB stores only the URL string. The actual image bytes live on Cloudinary's CDN.

---

## 8. Team Creation Flow

Requires: logged in + profileCompleted = true

```
User fills CreateTeamForm (name, tag, optional logo)
        │
        ├─ (Optional) logo → goes through Image Upload Flow (Step 7)
        │
        ▼
Browser → POST /api/teams
          { name: "Team Alpha", tag: "ALPH", logo?: "https://res.cloudinary.com/..." }
                │
                ▼
        auth() → verifies session
                │
                ├─ !session.user.profileCompleted → 403 "Complete your profile first"
                │
                ├─ createTeamSchema.safeParse(body) → Zod validation
                │   name: 3-30 chars
                │   tag: 2-5 uppercase letters
                │
                ├─ connectDB() → MongoDB Atlas
                │
                ├─ User.findById(session.user.id).select("teamId")
                │   If user.teamId exists → 409 "Already in a team"
                │
                ├─ Team.create({
                │     name: name.trim(),
                │     tag: tag.toUpperCase().trim(),
                │     logo: cloudinaryUrl or undefined,
                │     leaderId: session.user.id,
                │     members: [{
                │       userId: session.user.id,
                │       role: "core",
                │       joinedAt: new Date()
                │     }],
                │     shareToken: nanoid(10)  ← unique 10-char token for sharing
                │   })
                │   → Written to MongoDB: teams collection
                │
                ├─ If duplicate name/tag → MongoDB throws code 11000
                │   → return 409 "Team name/tag already taken"
                │
                └─ User.findByIdAndUpdate(session.user.id, {
                       teamId: team._id,      ← links user to team
                       isTeamLeader: true
                   })
                   → Updated in MongoDB: users collection

Browser ← { success: true, team: { _id, name, tag, ... } }
        │
        ▼
useSession().update() → refreshes JWT cookie
        (token.teamId and token.isTeamLeader are now set)
        │
        ▼
router.push(`/teams/${team._id}`)
```

---

## 9. Join Team Flow

### Step 1 — Player sends a join request

```
Player views team page → clicks "Request to Join"
        │
Browser → POST /api/teams/{teamId}/join-requests
          { role: "core" | "substitute", message: "optional message" }
                │
                ▼
        auth() → verifies session
                │
                ├─ !profileCompleted → 403
                │
                ├─ connectDB() → MongoDB Atlas
                │
                ├─ User.findById(session.user.id).select("teamId")
                │   If user.teamId exists → 409 "Already in a team"
                │
                ├─ Team.findById(teamId).select("members leaderId")
                │   If team.members.length >= 5 → 409 "Team is full"
                │
                ├─ JoinRequest.findOne({
                │     teamId, userId: session.user.id, status: "pending"
                │   })
                │   If exists → 409 "Already have a pending request"
                │
                └─ JoinRequest.create({
                       teamId,
                       userId: session.user.id,
                       requestedRole: role,
                       message: message?.trim(),
                       status: "pending"
                   })
                   → Written to MongoDB: joinrequests collection

Browser ← { success: true, joinRequest: { ... } }
```

### Step 2 — Team leader approves or rejects

```
Leader views /teams/{teamId} → sees pending requests → clicks Approve/Reject
        │
Browser → PATCH /api/teams/{teamId}/join-requests/{reqId}
          { action: "approve" | "reject" }
                │
                ▼
        auth() → verifies session.user.id === team.leaderId
                │
        If action === "approve":
                │
                ├─ ATOMIC membership guard:
                │   Team.findOneAndUpdate(
                │     { _id: teamId, "members.4": { $exists: false } },  ← only if < 5 members
                │     { $push: { members: { userId, role, joinedAt } } }
                │   )
                │   If returns null → 409 "Team is now full" (race condition prevented)
                │   → Written to MongoDB: teams collection
                │
                ├─ User.findByIdAndUpdate(userId, { teamId: team._id })
                │   → Written to MongoDB: users collection
                │
                ├─ JoinRequest.findByIdAndUpdate(reqId, {
                │     status: "approved",
                │     decidedAt: now,
                │     decidedBy: session.user.id
                │   })
                │   → Written to MongoDB: joinrequests collection
                │
                └─ (Future) Notification created + Pusher event fired
                    → Notification written to MongoDB: notifications collection

        If action === "reject":
                │
                └─ JoinRequest.findByIdAndUpdate(reqId, {
                       status: "rejected",
                       decidedAt: now,
                       decidedBy: session.user.id
                   })
                   → Written to MongoDB: joinrequests collection

Browser ← { success: true }
```

---

## 10. Admin Panel Access

```
User navigates to /admin
        │
        ▼
proxy.ts (Edge middleware) runs BEFORE the page loads
        │
        ├─ Reads JWT cookie → gets token.role
        ├─ pathname.startsWith("/admin") → true
        │
        ├─ If !user → redirect to /login?callbackUrl=/admin
        ├─ If user.role !== "admin" && user.role !== "super_admin"
        │   → redirect to /login?callbackUrl=/admin
        │
        ▼
(role check passed — user is admin or super_admin)
        │
        ▼
AdminLayout (Server Component) runs
        │
        ├─ auth() → reads same JWT cookie → full session object
        │   (second verification layer, in case middleware was bypassed somehow)
        │
        ├─ If !session.user.id OR role not admin/super_admin
        │   → redirect("/")
        │
        └─ Renders AdminSidebar + page content

AdminSidebar filters nav items:
        ├─ Dashboard → always visible to admin
        ├─ Players, Teams, etc. → visible if user has that permission
        │   hasPermission() checks: user.permissions.includes(PERMISSION_KEY)
        │   super_admin always returns true for all permissions
        │
        └─ Community, About Page, Admins → superAdminOnly: true
            only visible if user.role === "super_admin"
```

---

## 11. Admin: Assign Role / Promote Admin

Only super admin can do this.

```
Super admin goes to /admin/admins
        │
        ▼
Page server-fetches:
        User.find({ role: { $in: ["admin", "super_admin"] } })  → current admins
        User.find({ profileCompleted: true, role: "player" })   → available players

Super admin selects a player → checks permissions → clicks "Add Admin"
        │
Browser → PATCH /api/admin/users/{userId}
          { role: "admin", permissions: ["MANAGE_PLAYERS", "MANAGE_SCHEDULE", ...] }
                │
                ▼
        auth() → session.user.role === "super_admin"? If not → 403
                │
                ├─ Only these fields allowed: isVerifiedPlayer, statsHidden, role, permissions
                │
                ├─ role/permissions changes: ONLY super_admin can make them
                │
                └─ User.findByIdAndUpdate(userId, { $set: { role, permissions } })
                   → Written to MongoDB: users collection

Browser ← { success: true, user: { ...updatedUser } }
        │
        ▼
router.refresh() → page re-fetches and shows updated admin list
```

**Next time that user logs in:** their JWT token is populated from DB (role: "admin", permissions: [...]), and `proxy.ts` allows them into `/admin/*`.

---

## 12. Community Members Management

Super admin only. Controls who appears on the `/community` page.

```
Super admin goes to /admin/community
        │
        ▼
Page server-fetches:
        CommunityMember.find()
          .populate("userId", "name photo email degreeProgramme")
          .sort({ isHighlighted: -1, order: 1 })
        → MongoDB: communitymembers collection joined with users collection

        User.find({ profileCompleted: true })
        → available registered players to add

Super admin selects a registered user → enters role title → clicks "Add to Community"
        │
Browser → POST /api/admin/community-members
          { userId: "...", communityRole: "Co-Organizer", bio: "...",
            order: 0, isHighlighted: false }
                │
                ▼
        auth() → role === "super_admin"? If not → 403
                │
                ├─ CommunityMember.findOne({ userId }) → check not already added
                │
                └─ CommunityMember.create({
                       userId,          ← reference to User document (ObjectId)
                       communityRole,   ← display title
                       bio,
                       order,
                       isHighlighted    ← if true, shown prominently at top
                   })
                   → Written to MongoDB: communitymembers collection

Community page (/community) display:
        CommunityMember.find()
          .populate("userId", "name photo email degreeProgramme semester")
          → Joins communitymembers + users collections
          → Shows member's real name, photo from their User profile
          → Uses communityRole as display title
```

---

## 13. Password Change Flow

Only for credential (email/password) accounts. Google users cannot change password here.

```
User clicks "Change Password" button on profile
        (button only shown if user.provider === "credentials")
        │
        ▼
ChangePasswordModal opens → user enters currentPassword, newPassword, confirmPassword
        │
Browser → POST /api/users/me/change-password
          { currentPassword: "...", newPassword: "..." }
                │
                ▼
        auth() → reads JWT cookie → session.user.id
                │
                ├─ User.findById(session.user.id).select("+password")
                │   (select("+password") needed because password is excluded by default)
                │
                ├─ If user.provider !== "credentials" OR !user.password
                │   → 400 "Google sign-in accounts cannot change password here"
                │
                ├─ bcrypt.compare(currentPassword, user.password)
                │   If wrong → 400 "Current password is incorrect"
                │
                └─ user.password = await bcrypt.hash(newPassword, 12)
                   await user.save()
                   → Written to MongoDB: users collection (password field updated)

Browser ← { success: true }
        │
        ▼
toast.success("Password changed successfully!")
Modal closes — user remains logged in (JWT cookie unchanged)
```

---

## 14. Session & JWT Internals

### What's in the JWT token

```javascript
// Token stored as encrypted cookie in browser
{
  // Standard JWT fields
  sub: "user email",
  iat: issued-at timestamp,
  exp: expiry timestamp,
  jti: unique token ID,

  // Custom fields added by jwt() callback in auth.ts
  id: "64abc...mongodbObjectId",
  role: "player" | "admin" | "super_admin",
  permissions: ["MANAGE_PLAYERS", "MANAGE_GALLERY", ...],
  profileCompleted: true | false,
  isEmailVerified: true | false,
  teamId: "64def...mongodbObjectId" | undefined,
  isTeamLeader: true | false | undefined,

  // Standard NextAuth fields
  name: "User Name",
  email: "user@example.com",
  picture: "https://cloudinary.com/photo.jpg"
}
```

### When is the token refreshed?

| Trigger | What happens |
|---|---|
| `useSession().update()` called on client | NextAuth calls jwt() with `trigger: "update"` → reads fresh data from MongoDB → new cookie written |
| User signs in again | Fresh DB read, new token |
| Token expires | User must sign in again |

### Token does NOT auto-refresh

The token is NOT re-read from MongoDB on every request (that would be slow). It only refreshes on explicit `update()` call or re-login. This means:

- If an admin changes a user's role in the database, the user's session still shows the old role until they sign out and back in (or `update()` is called).
- Profile updates call `update()` explicitly to refresh `profileCompleted`, `teamId`, etc.

---

## 15. Database Collections Reference

| Collection | What it stores | Key indexes |
|---|---|---|
| `users` | All user accounts, profile data, role, permissions, teamId | email (unique), rollNumber (sparse unique), googleId (sparse unique) |
| `otptokens` | Temporary OTP codes (auto-deleted after expiry) | expiresAt (TTL), email |
| `teams` | Team records, members array, shareToken | name (unique), tag (unique), shareToken |
| `joinrequests` | Pending/approved/rejected team join requests | teamId, userId, status |
| `communitymembers` | Users shown on Community page with assigned roles | userId (unique) |
| `announcements` | Tournament news and announcements | isPinned, createdAt |
| `gallery` | Metadata for uploaded media (URLs stored, files on Cloudinary) | createdAt, tags |
| `playerstats` | Per-player game statistics | userId (unique), totalKills, isHidden |
| `matches` | Match schedule, results, player kills | tournamentId, status |
| `notifications` | In-app notifications (auto-deleted after 30 days) | userId, isRead, createdAt (TTL) |
| `tournaments` | Tournament configuration (single active document) | status |
| `rules` | Tournament rules rich text (single document) | — |
| `adminteammembers` | Static about-page team member entries (legacy) | — |

---

## 16. Where Each Piece of Data Lives

| Data | Location | Format |
|---|---|---|
| User password | MongoDB `users.password` | bcrypt hash (12 rounds), `select: false` |
| User profile photo | **Cloudinary** CDN | URL stored in MongoDB `users.photo` |
| Team logo | **Cloudinary** CDN | URL stored in MongoDB `teams.logo` |
| Gallery images/videos | **Cloudinary** CDN | URL + publicId stored in MongoDB `gallery` |
| OTP code | MongoDB `otptokens.otp` | bcrypt hash (10 rounds), TTL 10 min |
| Session/auth state | Browser cookie (JWT) | Signed with AUTH_SECRET, HttpOnly |
| User role | MongoDB `users.role` AND JWT cookie | Must match; JWT reflects DB at last login |
| Team membership | MongoDB: `users.teamId` + `teams.members[]` | Both updated atomically |
| Community member roles | MongoDB `communitymembers.communityRole` | Plain string |
| Emails sent | Nowhere (Resend doesn't store) | Sent and forgotten |
| Cloudinary API secret | Vercel env vars only | Never sent to browser |
| AUTH_SECRET | Vercel env vars only | Never sent to browser |

---

## Quick Reference: What happens when...

| Action | MongoDB | Cloudinary | Cookie/JWT |
|---|---|---|---|
| Register with email | Creates `otptokens` doc, then `users` doc | — | New JWT cookie created |
| Register with Google | Creates/updates `users` doc | — | New JWT cookie created |
| Login | Reads `users` (with password) | — | New JWT cookie created |
| Complete profile | Updates `users` doc | (if photo: uploads image) | `update()` called → JWT refreshed |
| Create team | Creates `teams` doc, updates `users.teamId` | (if logo: uploads image) | `update()` called → JWT refreshed |
| Send join request | Creates `joinrequests` doc | — | — |
| Approve join request | Updates `teams.members`, `users.teamId`, `joinrequests.status` | — | Player's JWT refreshed on next action |
| Change password | Updates `users.password` | — | — |
| Upload profile photo | Saves URL to `users.photo` | Stores compressed JPEG | — |
| Admin promotes user | Updates `users.role` + `users.permissions` | — | Promoted user's JWT refreshed on next login |
| Add community member | Creates `communitymembers` doc | — | — |
| OTP expires | MongoDB TTL index auto-deletes the document | — | — |
