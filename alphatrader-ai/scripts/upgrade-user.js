/**
 * Script to upgrade a user's subscription tier
 * Usage: node scripts/upgrade-user.js <email> <tier>
 * Example: node scripts/upgrade-user.js admin@admin.com PROFESSIONAL
 * Tiers: STARTER, PROFESSIONAL, ENTERPRISE
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function upgradeUser(email, tier) {
  const validTiers = ['STARTER', 'PROFESSIONAL', 'ENTERPRISE'];

  if (!validTiers.includes(tier)) {
    console.error(`❌ Invalid tier: ${tier}`);
    console.log(`Valid tiers: ${validTiers.join(', ')}`);
    process.exit(1);
  }

  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: { subscription: true }
    });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log(`\nUpgrading ${email} to ${tier}...\n`);

    // Create or update subscription
    const subscription = await prisma.subscription.upsert({
      where: { userId: user.id },
      update: {
        tier,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
      create: {
        userId: user.id,
        tier,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        alertsUsedThisMonth: 0,
        apiCallsThisMonth: 0,
      },
    });

    console.log('✅ User upgraded successfully!\n');
    console.table({
      email: user.email,
      name: user.name,
      tier: subscription.tier,
      status: subscription.status,
      validUntil: subscription.currentPeriodEnd?.toDateString()
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Get command line arguments
const email = process.argv[2];
const tier = process.argv[3];

if (!email || !tier) {
  console.log('Usage: node scripts/upgrade-user.js <email> <tier>');
  console.log('Example: node scripts/upgrade-user.js admin@admin.com PROFESSIONAL');
  console.log('Tiers: STARTER, PROFESSIONAL, ENTERPRISE');
  process.exit(1);
}

upgradeUser(email, tier);
