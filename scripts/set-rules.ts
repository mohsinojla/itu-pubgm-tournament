import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI ?? "";

const RulesSchema = new mongoose.Schema(
  {
    content: { type: String, required: true },
    lastEditedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const CONTENT = `
<h1>ITU × PUBGM Supremacy Cup — Rules &amp; Regulations</h1>
<p>All participants are expected to read and follow these rules. Violations may lead to penalties, including disqualification.</p>

<h2>Eligibility</h2>
<ul>
  <li>Players must be <strong>current students of ITU Lahore, Barki Campus</strong>.</li>
  <li>Your in-game PUBG Mobile ID and name must not contain invisible or unreadable characters.</li>
  <li>Joining another team while already registered with one can lead to disqualification.</li>
</ul>

<h2>Match Format</h2>
<ul>
  <li>All matches will be played on the <strong>Erangel</strong> map.</li>
  <li>Group stage matches are played <strong>online</strong>; final matches will be held <strong>on campus</strong>.</li>
  <li>Teams will be divided into two groups to avoid auto-kick issues during matches.</li>
</ul>

<h2>Fair Play &amp; Conduct</h2>
<ul>
  <li>Any confirmed unfair activity (cheating, teaming with rivals, exploiting bugs, etc.) can lead to disqualification or penalty.</li>
  <li>Organizers' decisions on rule violations are final.</li>
</ul>

<h2>Prize Pool</h2>
<ul>
  <li>The prize pool is based on the number of participants, with a <strong>minimum guaranteed pool of PKR 27,000</strong> (up to PKR 43,000 depending on turnout).</li>
  <li>Prizes are divided <strong>50% / 30% / 20%</strong> between 1st, 2nd, and 3rd place.</li>
  <li>See the <a href="/prizes">Prizes &amp; Rewards</a> page for full details, including certificates and bonus perks.</li>
</ul>

<p>Have questions? Visit the Registration Desk on campus, or reach out through the <a href="/queries">Queries</a> page.</p>
`.trim();

async function main() {
  if (!MONGODB_URI) {
    console.error("MONGODB_URI is not set");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const Rules = mongoose.models.Rules || mongoose.model("Rules", RulesSchema);

  await Rules.findOneAndUpdate({}, { content: CONTENT }, { upsert: true, new: true });
  console.log("✅ Rules content updated");

  process.exit(0);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
