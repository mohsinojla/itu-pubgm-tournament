import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/db/models/User";
import { authConfig } from "./auth.config";

const SUPER_ADMIN_EMAIL = "mohsinrazaojla32@gmail.com";

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        stayLoggedIn: { label: "Stay Logged In", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await connectDB();

        const user = await User.findOne({
          email: (credentials.email as string).toLowerCase(),
        }).select("+password");

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        if (!isValid) return null;
        if (!user.isEmailVerified) throw new Error("EMAIL_NOT_VERIFIED");

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.photo,
          role: user.role,
          permissions: user.permissions,
          profileCompleted: user.profileCompleted,
          isEmailVerified: user.isEmailVerified,
          teamId: user.teamId?.toString(),
          isTeamLeader: user.isTeamLeader,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      // Google OAuth — create user if new
      if (account?.provider === "google") {
        await connectDB();

        const existing = await User.findOne({
          $or: [{ googleId: account.providerAccountId }, { email: user.email }],
        });

        if (!existing) {
          const email = user.email!.toLowerCase();
          const isSuperAdmin = email === SUPER_ADMIN_EMAIL;

          await User.create({
            email,
            googleId: account.providerAccountId,
            provider: "google",
            name: user.name ?? undefined,
            photo: user.image ?? undefined,
            isEmailVerified: true,
            profileCompleted: false,
            role: isSuperAdmin ? "super_admin" : "player",
            permissions: [],
          });
        } else if (!existing.googleId) {
          existing.googleId = account.providerAccountId;
          await existing.save();
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger }) {
      if (user) {
        // Initial sign in — user object is from authorize or OAuth profile
        if (account?.provider === "google") {
          await connectDB();
          const dbUser = await User.findOne({ email: token.email });
          if (dbUser) {
            token.id = dbUser._id.toString();
            token.role = dbUser.role;
            token.permissions = dbUser.permissions;
            token.profileCompleted = dbUser.profileCompleted;
            token.isEmailVerified = dbUser.isEmailVerified;
            token.teamId = dbUser.teamId?.toString();
            token.isTeamLeader = dbUser.isTeamLeader;
          }
        } else {
          token.id = user.id;
          token.role = (user as typeof user & { role: string }).role;
          token.permissions = (user as typeof user & { permissions: string[] }).permissions;
          token.profileCompleted = (user as typeof user & { profileCompleted: boolean }).profileCompleted;
          token.isEmailVerified = (user as typeof user & { isEmailVerified: boolean }).isEmailVerified;
          token.teamId = (user as typeof user & { teamId?: string }).teamId;
          token.isTeamLeader = (user as typeof user & { isTeamLeader?: boolean }).isTeamLeader;
        }
      }

      // Refresh token data on session update
      if (trigger === "update" && token.id) {
        await connectDB();
        const dbUser = await User.findById(token.id);
        if (dbUser) {
          token.role = dbUser.role;
          token.permissions = dbUser.permissions;
          token.profileCompleted = dbUser.profileCompleted;
          token.isEmailVerified = dbUser.isEmailVerified;
          token.teamId = dbUser.teamId?.toString();
          token.isTeamLeader = dbUser.isTeamLeader;
          token.name = dbUser.name;
          token.picture = dbUser.photo;
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as "player" | "admin" | "super_admin";
      session.user.permissions = (token.permissions as string[]) ?? [];
      session.user.profileCompleted = token.profileCompleted as boolean;
      session.user.isEmailVerified = token.isEmailVerified as boolean;
      session.user.teamId = token.teamId as string | undefined;
      session.user.isTeamLeader = token.isTeamLeader as boolean | undefined;
      return session;
    },
  },
});
