const bcrypt = require("bcryptjs");
const { prisma } = require("../../../lib/db");

async function POST(req) {
  const body = await req.json();
  const email = (body.email || "").toLowerCase().trim();
  const password = body.password || "";
  const name = body.name || "";

  if (!email || !password || password.length < 8) {
    return Response.json(
      { error: "Email and a password of at least 8 characters are required." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return Response.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, name },
  });

  return Response.json({ id: user.id, email: user.email });
}

module.exports = { POST };
