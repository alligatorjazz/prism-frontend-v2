// apply-get-involved-changes.mjs
// Run from the project root: node apply-get-involved-changes.mjs

import { writeFile, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const ROOT = process.cwd();

// --- File contents ---

const coreTrackCard = `---
// src/components/CoreTrackCard.astro
interface Props {
  title: string;
  icon: string;
  color: string;
  description: string;
  activities: string[];
  pipeline: string;
  image: string;
  link?: string;
}

const { title, icon, color, description, activities, pipeline, image, link } = Astro.props;
---

<div class="core-track-card" style={\\\`--track-color: \\\${color}\\\`}>
  <div class="card-image">
    <img src={image} alt={title} width={400} height={300} />
  </div>
  <div class="card-content">
    <div class="card-header">
      <span class="track-icon">{icon}</span>
      <h3>{title}</h3>
    </div>
    <p class="description">{description}</p>
    <div class="activities">
      <h4>Activities</h4>
      <ul>
        {activities.map((activity) => (
          <li>{activity}</li>
        ))}
      </ul>
    </div>
    <div class="pipeline">
      <h4>Pipeline</h4>
      <p>{pipeline}</p>
    </div>
    {link && (
      <a href={link} class="learn-more">
        Learn More →
      </a>
    )}
  </div>
</div>

<style lang="scss">
  .core-track-card {
    background: var(--fg-color);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    display: flex;
    flex-direction: column;
    height: 100%;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
    }

    .card-image {
      width: 100%;
      height: 200px;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .card-content {
      padding: 1.5rem;
      flex: 1;
      display: flex;
      flex-direction: column;

      .card-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;

        .track-icon {
          font-size: 2rem;
        }

        h3 {
          margin: 0;
          font-size: 1.5rem;
          color: var(--track-color);
        }
      }

      .description {
        margin: 0 0 1.5rem 0;
        line-height: 1.6;
        color: var(--text-color);
      }

      .activities {
        margin-bottom: 1.5rem;

        h4 {
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
          color: var(--track-color);
        }

        ul {
          margin: 0;
          padding-left: 1.5rem;

          li {
            margin-bottom: 0.25rem;
            line-height: 1.5;
          }
        }
      }

      .pipeline {
        margin-bottom: 1.5rem;
        padding: 1rem;
        background: rgba(0, 0, 0, 0.03);
        border-radius: 8px;

        h4 {
          margin: 0 0 0.5rem 0;
          font-size: 0.9rem;
          color: var(--track-color);
        }

        p {
          margin: 0;
          font-size: 0.9rem;
          line-height: 1.5;
        }
      }

      .learn-more {
        margin-top: auto;
        display: inline-block;
        padding: 0.75rem 1.5rem;
        background: var(--track-color);
        color: white;
        text-decoration: none;
        border-radius: 6px;
        text-align: center;
        transition: opacity 0.2s ease;

        &:hover {
          opacity: 0.9;
        }
      }
    }
  }
</style>
`;

const leadershipProgramCard = `---
// src/components/LeadershipProgramCard.astro
interface Props {
  title: string;
  icon: string;
  color: string;
  description: string;
  duration: string;
  eligibility: string[];
  benefits: string[];
  image: string;
  link?: string;
}

const { title, icon, color, description, duration, eligibility, benefits, image, link } = Astro.props;
---

<div class="leadership-program-card" style={\\\`--program-color: \\\${color}\\\`}>
  <div class="card-image">
    <img src={image} alt={title} width={400} height={250} />
  </div>
  <div class="card-content">
    <div class="card-header">
      <span class="program-icon">{icon}</span>
      <h3>{title}</h3>
    </div>
    <p class="duration">{duration}</p>
    <p class="description">{description}</p>
    <div class="eligibility">
      <h4>Eligibility</h4>
      <ul>
        {eligibility.map((item) => (
          <li>{item}</li>
        ))}
      </ul>
    </div>
    <div class="benefits">
      <h4>Benefits</h4>
      <ul>
        {benefits.map((benefit) => (
          <li>{benefit}</li>
        ))}
      </ul>
    </div>
    {link && (
      <a href={link} class="apply-now">
        Apply Now →
      </a>
    )}
  </div>
</div>

<style lang="scss">
  .leadership-program-card {
    background: var(--fg-color);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    display: flex;
    flex-direction: column;
    height: 100%;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
    }

    .card-image {
      width: 100%;
      height: 180px;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .card-content {
      padding: 1.5rem;
      flex: 1;
      display: flex;
      flex-direction: column;

      .card-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.5rem;

        .program-icon {
          font-size: 2rem;
        }

        h3 {
          margin: 0;
          font-size: 1.5rem;
          color: var(--program-color);
        }
      }

      .duration {
        margin: 0 0 1rem 0;
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--program-color);
      }

      .description {
        margin: 0 0 1.5rem 0;
        line-height: 1.6;
        color: var(--text-color);
      }

      .eligibility,
      .benefits {
        margin-bottom: 1rem;

        h4 {
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
          color: var(--program-color);
        }

        ul {
          margin: 0;
          padding-left: 1.5rem;

          li {
            margin-bottom: 0.25rem;
            line-height: 1.5;
            font-size: 0.95rem;
          }
        }
      }

      .apply-now {
        margin-top: auto;
        display: inline-block;
        padding: 0.75rem 1.5rem;
        background: var(--program-color);
        color: white;
        text-decoration: none;
        border-radius: 6px;
        text-align: center;
        transition: opacity 0.2s ease;

        &:hover {
          opacity: 0.9;
        }
      }
    }
  }
</style>
`;

const ladderOfEngagement = `---
// src/components/LadderOfEngagement.astro
// Based on: Membership Model - Section 1: Leadership Pipeline (Ladder of Engagement)

type Tier = {
  level: number;
  name: string;
  description: string;
  gateway?: string;
};

const tiers: Tier[] = [
  {
    level: 1,
    name: "Supporter",
    description: "Informed but unengaged. Follows social media, subscribes to newsletter.",
  },
  {
    level: 2,
    name: "Volunteer",
    description: "Mobilized for action. Attends events, tabling, phone banks.",
    gateway: "Gateway: Quarterly Orientation OR 1:1 intake",
  },
  {
    level: 3,
    name: "Member",
    description: "Actively engaged organizer. Attends All-Member Trainings and participates in a Core Track.",
    gateway: "Gateway: 1:1 intake + track selection",
  },
  {
    level: 4,
    name: "Leader",
    description: "Takes ownership of initiatives. Mobilizes others, conducts peer 1:1s, hosts events, manages projects.",
  },
];
---

<div class="ladder-of-engagement">
  <h2>The Ladder of Engagement</h2>
  <p class="intro">
    PRISM uses a four-tier progression model to develop engaged, empowered youth leaders.
  </p>
  <div class="tiers">
    {
      tiers.map((tier) => (
        <div class={\\\`tier tier-\\\${tier.level}\\\`}>
          <div class="tier-header">
            <span class="tier-number">Tier {tier.level}</span>
            <h3>{tier.name}</h3>
          </div>
          <p class="tier-description">{tier.description}</p>
          {tier.gateway && <p class="tier-gateway">{tier.gateway}</p>}
        </div>
      ))
    }
  </div>
</div>

<style lang="scss">
  .ladder-of-engagement {
    padding: 3rem 2rem;
    background: var(--bg-color);

    h2 {
      text-align: center;
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }

    .intro {
      text-align: center;
      max-width: 700px;
      margin: 0 auto 3rem auto;
      font-size: 1.1rem;
      line-height: 1.6;
    }

    .tiers {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      max-width: 1200px;
      margin: 0 auto;

      .tier {
        background: var(--fg-color);
        padding: 2rem;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        position: relative;
        overflow: hidden;

        &::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 6px;
          background: linear-gradient(
            90deg,
            var(--rainbow-red),
            var(--rainbow-orange),
            var(--rainbow-yellow),
            var(--rainbow-green),
            var(--rainbow-blue),
            var(--rainbow-purple)
          );
        }

        .tier-header {
          margin-bottom: 1rem;

          .tier-number {
            display: block;
            font-size: 0.9rem;
            font-weight: 600;
            color: var(--rainbow-purple);
            margin-bottom: 0.25rem;
          }

          h3 {
            margin: 0;
            font-size: 1.75rem;
            color: var(--text-color);
          }
        }

        .tier-description {
          margin: 0 0 1rem 0;
          line-height: 1.6;
          color: var(--text-color);
        }

        .tier-gateway {
          margin: 0;
          padding: 0.75rem;
          background: rgba(0, 0, 0, 0.05);
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--rainbow-blue);
        }
      }
    }
  }
</style>
`;

const coreTracksSection = `---
// src/sections/CoreTracks.astro
// Based on: Membership Model - Section 3: Core Track Pathways
import CoreTrackCard from "@components/CoreTrackCard.astro";
import { faker } from "@faker-js/faker";

// TODO: Replace with actual images from @assets/img/
const outreachImage = faker.image.urlPicsumPhotos({ width: 400, height: 300 });
const policyImage = faker.image.urlPicsumPhotos({ width: 400, height: 300 });
const operationsImage = faker.image.urlPicsumPhotos({ width: 400, height: 300 });
---

<section class="core-tracks-section">
  <div class="section-content">
    <h2>Core Track Pathways</h2>
    <p class="intro">
      Once Volunteers become Members, they specialize in one of three Core Tracks. Each track offers distinct activities, skills development, and leadership opportunities.
    </p>
    <div class="tracks-grid">
      <CoreTrackCard
        title="Outreach"
        icon="📢"
        color="var(--rainbow-orange)"
        description="Mass Outreach & Harm Reduction. Frontline public engagement, community visibility, and high-volume initial contact."
        activities={[
          "Tabling at festivals and community events",
          "Sexual health education and resource distribution",
          "Harm-reduction resources (Naloxone, condoms, lubricants)",
          "Social events with intentional organizing conversations",
        ]}
        pipeline="Volunteer (tabling, resource distribution) → Member (deeper conversations, event design) → Leader (tabling lead, social events, training)"
        image={outreachImage}
        link="/outreach"
      />
      <CoreTrackCard
        title="Policy"
        icon="⚖️"
        color="var(--rainbow-red)"
        description="Advocacy & Legislation. Legislative and advocacy engine fighting for LGBTQ+ rights, reproductive justice, and academic freedom."
        activities={[
          "Legislative and school board tracking",
          "Lobbying initiatives and public testimony",
          "Accountability programming (roundtables, town halls)",
          "Policy research and advocacy campaigns",
        ]}
        pipeline="Volunteer (petitions, school board presence) → Member (public testimony, policy research) → Leader (advocacy workshops, campaign oversight, lobbying)"
        image={policyImage}
        link="/policy"
      />
      <CoreTrackCard
        title="People's Operations"
        icon="🤝"
        color="var(--rainbow-aqua, #00bcd4)"
        description="Internal Base-Building. The backbone of community; member retention, engagement, and safety."
        activities={[
          "Membership growth and retention",
          "Discord community management",
          "Relational outreach (phonebanking, wellness checks)",
          "Event coordination and member support",
        ]}
        pipeline="Starts at Member tier (Discord engagement, wellness checks, recruitment) → Leader (intake 1:1s, orientations, Discord moderation)"
        image={operationsImage}
        link="/operations"
      />
    </div>
  </div>
</section>

<style lang="scss">
  .core-tracks-section {
    padding: 4rem 2rem;
    background: var(--bg-color);

    .section-content {
      max-width: 1200px;
      margin: 0 auto;

      h2 {
        text-align: center;
        font-size: 2.5rem;
        margin-bottom: 1rem;
      }

      .intro {
        text-align: center;
        max-width: 800px;
        margin: 0 auto 3rem auto;
        font-size: 1.1rem;
        line-height: 1.6;
      }

      .tracks-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 2rem;
      }
    }
  }
</style>
`;

const leadershipProgramsSection = `---
// src/sections/LeadershipPrograms.astro
// Based on: Membership Model - Section 4: Specialized Leadership Programs (Leader Tier)
import LeadershipProgramCard from "@components/LeadershipProgramCard.astro";
import { faker } from "@faker-js/faker";

// TODO: Replace with actual images from @assets/img/
const fellowshipImage = faker.image.urlPicsumPhotos({ width: 400, height: 250 });
const psapImage = faker.image.urlPicsumPhotos({ width: 400, height: 250 });
const yacImage = faker.image.urlPicsumPhotos({ width: 400, height: 250 });
---

<section class="leadership-programs-section">
  <div class="section-content">
    <h2>Specialized Leadership Programs</h2>
    <p class="intro">
      Capstone programs for committed youth leaders ready to take ownership and drive PRISM's mission forward.
    </p>
    <div class="programs-grid">
      <LeadershipProgramCard
        title="Creative Fellowship"
        icon="🟢"
        color="var(--rainbow-green)"
        description="6-month volunteer leadership cohort for LGBTQ+ and allied students under 24. Fellows produce content, develop professional skills, and showcase their work at a public event."
        duration="6-month program"
        eligibility={[
          "LGBTQ+ or allied students under 24",
          "Commitment to monthly content deliverables",
          "Passion for storytelling and advocacy",
        ]}
        benefits={[
          "Professional development training",
          "Mentorship from Content Creation Director",
          "Portfolio of published work",
          "Public showcase event",
        ]}
        image={fellowshipImage}
        link="/creative-fellowship"
      />
      <LeadershipProgramCard
        title="Student Ambassador Program (P-SAP)"
        icon="🟣"
        color="var(--rainbow-purple)"
        description="GSA network empowerment program for high school and university LGBTQ+ organization leaders. Provides resources, training, and support for student activists."
        duration="Ongoing program"
        eligibility={[
          "Leadership position in LGBTQ+ club",
          "Intent to start a club OR designated as Student Ambassador",
          "Commitment to monthly meetings and Bootcamp",
        ]}
        benefits={[
          "Cash stipends",
          "4-day GSA Bootcamp",
          "Monthly meetings and mentorship",
          "Legal and policy guidance",
        ]}
        image={psapImage}
        link="/psap"
      />
      <LeadershipProgramCard
        title="Youth Advisory Committee (YAC)"
        icon="🟡"
        color="var(--rainbow-yellow)"
        description="9-month board governance program for strategy review and recommendations. Works directly with the Executive Director and YAC Chair."
        duration="9-month program"
        eligibility={[
          "Demonstrated leadership experience",
          "Commitment to monthly meetings",
          "Interest in nonprofit governance",
        ]}
        benefits={[
          "Direct experience with board governance",
          "Mentorship from Executive Director",
          "Strategic planning experience",
          "Networking opportunities",
        ]}
        image={yacImage}
        link="/yac"
      />
    </div>
  </div>
</section>

<style lang="scss">
  .leadership-programs-section {
    padding: 4rem 2rem;
    background: var(--bg-color);

    .section-content {
      max-width: 1200px;
      margin: 0 auto;

      h2 {
        text-align: center;
        font-size: 2.5rem;
        margin-bottom: 1rem;
      }

      .intro {
        text-align: center;
        max-width: 800px;
        margin: 0 auto 3rem auto;
        font-size: 1.1rem;
        line-height: 1.6;
      }

      .programs-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 2rem;
      }
    }
  }
</style>
`;

const getInvolvedPage = `---
// src/pages/get-involved.astro
// Based on: Membership Model document (Updated August 2026)
import Base from "@templates/Base.astro";
import PageIntro from "@components/PageIntro.astro";
import SectionBorder from "@components/SectionBorder.astro";
import LadderOfEngagement from "@components/LadderOfEngagement.astro";
import CoreTracks from "@sections/CoreTracks.astro";
import LeadershipPrograms from "@sections/LeadershipPrograms.astro";
import { faker } from "@faker-js/faker";

// TODO: Replace with actual images from @assets/img/
const heroImage = faker.image.urlPicsumPhotos({ width: 1200, height: 600 });
---

<Base
  pageMetadata={{
    title: "Get Involved",
    description: "Join PRISM's movement for LGBTQ+ youth empowerment and sexual health education.",
    type: "website",
    image: heroImage,
    "image:alt": "PRISM Get Involved",
  }}
>
  <main>
    <!-- Hero Section -->
    <PageIntro
      title="Get Involved with PRISM"
      subtitle="Join our movement for LGBTQ+ youth empowerment and sexual health education in South Florida."
      image={heroImage}
    />

    <!-- Ladder of Engagement -->
    <!-- Based on: Membership Model - Section 1: Leadership Pipeline -->
    <LadderOfEngagement />

    <SectionBorder style="spray-paint" />

    <!-- How to Get Started -->
    <!-- Based on: Membership Model - Section 6: Onboarding Process -->
    <section class="get-started-section">
      <div class="section-content">
        <h2>How to Get Started</h2>
        <div class="steps">
          <div class="step">
            <div class="step-number">1</div>
            <h3>Complete Interest Form</h3>
            <p>Fill out our Volunteer Interest Form to let us know you're interested in joining PRISM.</p>
          </div>
          <div class="step">
            <div class="step-number">2</div>
            <h3>Attend Orientation</h3>
            <p>Join our Quarterly Orientation OR schedule a 1:1 intake with our Organizing Director.</p>
          </div>
          <div class="step">
            <div class="step-number">3</div>
            <h3>Join the Community</h3>
            <p>Get added to our Discord, connect with track leads, and start making a difference!</p>
          </div>
        </div>
        <div class="cta-buttons">
          <a href="/volunteer-interest" class="cta-button primary">Volunteer Interest Form</a>
          <a href="/orientation" class="cta-button secondary">Upcoming Orientations</a>
        </div>
      </div>
    </section>

    <SectionBorder style="marker" />

    <!-- Core Tracks -->
    <!-- Based on: Membership Model - Section 3: Core Track Pathways -->
    <CoreTracks />

    <SectionBorder style="wave" />

    <!-- Leadership Programs -->
    <!-- Based on: Membership Model - Section 4: Specialized Leadership Programs -->
    <LeadershipPrograms />

    <SectionBorder style="spray-paint" />

    <!-- 2026 Recruitment Goals -->
    <!-- Based on: Membership Model - Section 7: 2026 Recruitment Strategy -->
    <section class="recruitment-section">
      <div class="section-content">
        <h2>2026 Recruitment Goals</h2>
        <p class="goal">We're looking for <strong>50 new volunteers</strong> to join our movement this year!</p>
        <div class="recruitment-channels">
          <div class="channel">
            <span class="percentage">50%</span>
            <h3>Community Events</h3>
            <p>25 recruits through festivals, social mixers, and QR signups</p>
          </div>
          <div class="channel">
            <span class="percentage">30%</span>
            <h3>In-School (P-SAP)</h3>
            <p>15 recruits through peer-to-peer organizing via GSA leaders</p>
          </div>
          <div class="channel">
            <span class="percentage">20%</span>
            <h3>Social Media (CCTF)</h3>
            <p>10 recruits through interactive campaigns with direct CTAs</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="final-cta">
      <div class="section-content">
        <h2>Ready to Make a Difference?</h2>
        <p>Join PRISM and help us create a more inclusive South Florida for LGBTQ+ youth.</p>
        <a href="/volunteer-interest" class="cta-button primary">Get Started Today</a>
      </div>
    </section>
  </main>
</Base>

<style lang="scss">
  @use "@styles/utils.scss" as *;

  main {
    padding: 0;
  }

  .get-started-section {
    padding: 4rem 2rem;
    background: var(--bg-color);

    .section-content {
      max-width: 1000px;
      margin: 0 auto;

      h2 {
        text-align: center;
        font-size: 2.5rem;
        margin-bottom: 3rem;
      }

      .steps {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 2rem;
        margin-bottom: 3rem;

        .step {
          background: var(--fg-color);
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          text-align: center;

          .step-number {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 60px;
            height: 60px;
            background: var(--rainbow-purple);
            color: white;
            border-radius: 50%;
            font-size: 1.5rem;
            font-weight: bold;
            margin-bottom: 1rem;
          }

          h3 {
            margin: 0 0 1rem 0;
            font-size: 1.5rem;
          }

          p {
            margin: 0;
            line-height: 1.6;
          }
        }
      }

      .cta-buttons {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
      }
    }
  }

  .recruitment-section {
    padding: 4rem 2rem;
    background: var(--bg-color);

    .section-content {
      max-width: 1000px;
      margin: 0 auto;
      text-align: center;

      h2 {
        font-size: 2.5rem;
        margin-bottom: 1rem;
      }

      .goal {
        font-size: 1.3rem;
        margin-bottom: 3rem;

        strong {
          color: var(--rainbow-purple);
        }
      }

      .recruitment-channels {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 2rem;

        .channel {
          background: var(--fg-color);
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

          .percentage {
            display: block;
            font-size: 3rem;
            font-weight: bold;
            color: var(--rainbow-orange);
            margin-bottom: 0.5rem;
          }

          h3 {
            margin: 0 0 1rem 0;
            font-size: 1.3rem;
          }

          p {
            margin: 0;
            line-height: 1.5;
          }
        }
      }
    }
  }

  .final-cta {
    padding: 4rem 2rem;
    background: linear-gradient(
      135deg,
      var(--rainbow-red),
      var(--rainbow-orange),
      var(--rainbow-yellow),
      var(--rainbow-green),
      var(--rainbow-blue),
      var(--rainbow-purple)
    );
    text-align: center;
    color: white;

    .section-content {
      max-width: 800px;
      margin: 0 auto;

      h2 {
        font-size: 2.5rem;
        margin-bottom: 1rem;
      }

      p {
        font-size: 1.2rem;
        margin-bottom: 2rem;
      }

      .cta-button {
        background: white;
        color: var(--rainbow-purple);

        &:hover {
          background: var(--fg-color);
        }
      }
    }
  }

  .cta-button {
    display: inline-block;
    padding: 1rem 2rem;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.2s ease;

    &.primary {
      background: var(--rainbow-purple);
      color: white;

      &:hover {
        opacity: 0.9;
        transform: translateY(-2px);
      }
    }

    &.secondary {
      background: var(--fg-color);
      color: var(--text-color);
      border: 2px solid var(--rainbow-purple);

      &:hover {
        background: var(--rainbow-purple);
        color: white;
      }
    }
  }
</style>
`;

// --- Helper to write a file, creating parent dirs as needed ---

async function write(filePath, content) {
  const dir = filePath.substring(0, filePath.lastIndexOf("/"));
  await mkdir(dir, { recursive: true });
  await writeFile(filePath, content, "utf-8");
  console.log(`✅ Created: ${filePath}`);
}

// --- Main ---

async function main() {
  try {
    // 1. Create new components
    await write(
      join(ROOT, "src/components/CoreTrackCard.astro"),
      coreTrackCard,
    );
    await write(
      join(ROOT, "src/components/LeadershipProgramCard.astro"),
      leadershipProgramCard,
    );
    await write(
      join(ROOT, "src/components/LadderOfEngagement.astro"),
      ladderOfEngagement,
    );

    // 2. Create new sections
    await write(join(ROOT, "src/sections/CoreTracks.astro"), coreTracksSection);
    await write(
      join(ROOT, "src/sections/LeadershipPrograms.astro"),
      leadershipProgramsSection,
    );

    // 3. Overwrite get-involved page
    await write(join(ROOT, "src/pages/get-involved.astro"), getInvolvedPage);

    // 4. Patch tsconfig.json to add @sections/* alias
    const tsconfigPath = join(ROOT, "tsconfig.json");
    const tsconfigRaw = await readFile(tsconfigPath, "utf-8");
    const tsconfig = JSON.parse(tsconfigRaw);

    if (!tsconfig.compilerOptions) tsconfig.compilerOptions = {};
    if (!tsconfig.compilerOptions.paths) tsconfig.compilerOptions.paths = {};

    tsconfig.compilerOptions.paths["@sections/*"] = ["./src/sections/*"];

    await writeFile(
      tsconfigPath,
      JSON.stringify(tsconfig, null, 2) + "\n",
      "utf-8",
    );
    console.log(`✅ Updated: ${tsconfigPath} (added @sections/* alias)`);

    console.log("\n🎉 All changes applied successfully!");
    console.log("\nFiles created/modified:");
    console.log("  + src/components/CoreTrackCard.astro");
    console.log("  + src/components/LeadershipProgramCard.astro");
    console.log("  + src/components/LadderOfEngagement.astro");
    console.log("  + src/sections/CoreTracks.astro");
    console.log("  + src/sections/LeadershipPrograms.astro");
    console.log("  ~ src/pages/get-involved.astro");
    console.log("  ~ tsconfig.json");
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

main();
