// scripts/create-track-pages.js
// Run from project root: node scripts/create-track-pages.js

import fs from "node:fs";
import path from "node:path";

const pagesDir = path.resolve("src/pages");

if (!fs.existsSync(pagesDir)) {
  fs.mkdirSync(pagesDir, { recursive: true });
}

const pages = {
  "policy.astro": `---
import Base from "@templates/Base.astro";
import PageIntro from "@sections/PageIntro.astro";
import ruledBg from "@assets/img/ruled-bg.png";
import SectionBorder from "@components/SectionBorder.astro";
import Polaroid from "@components/Polaroid.astro";
import { faker } from "@faker-js/faker";
import { getImage } from "astro:assets";
import TornPaperBox from "@components/TornPaperBox.astro";
import scale from "@assets/img/scale.avif";

const ruledPaper = \`url(\${(await getImage({ src: ruledBg, format: "webp" })).src})\`;
const milesPhoto = faker.image.avatar();
---

<Base
  pageMetadata={{
    title: "Policy Core Track",
    description:
      "The Policy Track is the legislative and advocacy engine of PRISM, fighting for LGBTQ+ rights, reproductive justice, and academic freedom at every level of government.",
    type: "website",
    image: "https://picsum.photos/200",
    "image:alt": "Policy Core Track",
  }}
  class="page-content"
>
  <PageIntro
    title="Policy"
    description="The Policy Track is the legislative and advocacy engine of PRISM, dedicated to fighting for LGBTQ+ rights, reproductive justice, and academic freedom at the local, state, and national levels. We center the needs of LGBTQ+ young people across South Florida by navigating political landscapes, engaging with elected officials, and ensuring that student voices are heard in the halls of power."
    image={scale}
    pointBackTo={{ href: "/get-involved/", label: "Get Involved" }}
    class="intro"
  />

  <main>
    <SectionBorder type="marker" backgroundColor="rainbow-red" />

    <section id="staff" style={{ backgroundImage: ruledPaper }}>
      <div class="container">
        <h3>Meet the Policy Director!</h3>
        <div class="content">
          <article>
            <div class="person">
              <Polaroid
                class="portrait"
                image={{
                  src: milesPhoto,
                  alt: "Portrait of Miles Davis",
                  format: "webp",
                  width: 300,
                  height: 300,
                }}
                label="Miles Davis"
              />
            </div>
            <div class="description">
              <h4>Policy Director</h4>
              <p>
                Miles Davis has a diverse background in legislative affairs, voting
                rights advocacy, and political campaigns. He served as Chief of
                Staff in the Florida Senate, where he provided strategic guidance
                on policy initiatives and built strong relationships with community
                leaders and state agencies. As Florida Voting Rights Director at
                America Votes, Miles worked to protect and expand voter access,
                collaborating with state and local stakeholders to create
                coordinated strategies. He has also led teams on high-profile
                political campaigns, serving as a Political Director and Campaign
                Manager for statewide and regional efforts. Miles is passionate
                about empowering communities, advancing civic engagement, and
                fostering equitable opportunities for all.
              </p>
              <button type="button">Read More About Miles</button>
            </div>
          </article>
        </div>
      </div>
    </section>

    <SectionBorder type="marker" backgroundColor="rainbow-red" flip />

    <section id="pathway">
      <div class="container">
        <h3>How to Get Involved</h3>
        <div class="tiers">
          <article>
            <span class="tier-label">Volunteer</span>
            <p>
              Participates in mass mobilizations, signs petitions, and delivers
              prepared public testimony to lawmakers.
            </p>
            <p class="trainings">
              <strong>Trainings:</strong> Civics 101, Advocacy Basics
            </p>
          </article>

          <article>
            <span class="tier-label member">Member</span>
            <p>
              Shapes local decisions by directly interfacing with lawmakers and
              conducting policy research.
            </p>
            <p class="trainings">
              <strong>Trainings:</strong> Power Mapping, Testifying 101
            </p>
          </article>

          <article>
            <span class="tier-label leader">Leader</span>
            <p>
              Hosts advocacy workshops, oversees local campaigns, leads
              rapid-response teams, and/or serves as Lobbying Captains.
            </p>
            <p class="trainings">
              <strong>Trainings:</strong> Advanced Lobbying, Policy Language
              Drafting
            </p>
          </article>
        </div>
      </div>
    </section>

    <SectionBorder type="marker" backgroundColor="rainbow-red" />

    <section id="cta" style={{ backgroundImage: ruledPaper }}>
      <div class="container">
        <TornPaperBox>
          <h3>Ready to Fight for Our Rights?</h3>
          <p>
            Whether you're testifying at a school board meeting, researching
            priority legislation, or mobilizing volunteers for a lobby day, every
            action strengthens our collective power. Join the Policy Track and
            help ensure that LGBTQ+ young people have a seat at the table where
            decisions about their lives are made.
          </p>
          <a href="/volunteer/" class="cta-button">
            Sign Up to Volunteer
          </a>
        </TornPaperBox>
      </div>
    </section>

    <SectionBorder type="marker" backgroundColor="rainbow-red" flip />
  </main>

  <style>
    .page-content {
      background-color: var(--rainbow-red);
    }

    main {
      margin: auto;
      font-size: 1.25rem;

      h2 {
        font-size: 2rem;
        text-align: center;
      }

      h3 {
        text-align: center;
        font-size: 1.75rem;
      }

      h4 {
        font-size: 1.5rem;
      }
    }

    .container {
      max-width: var(--xl);
      margin: auto;
      padding: 0 1rem;
    }

    #staff {
      padding: 4rem 0;
      background-size: 2100px;

      .content {
        max-width: var(--lg);
        display: flex;
        align-items: center;
        gap: 1rem;
        margin: auto;
        padding: 2rem 0;

        article {
          display: flex;
          gap: 1rem;

          .person {
            display: flex;
            flex-direction: column;

            .portrait {
              width: 220px;
              height: 250px;
              filter: var(--shadow);
            }

            .name {
              white-space: nowrap;
              font-family: var(--header-font);
              text-align: center;
            }
          }

          .description {
            display: flex;
            flex-direction: column;
            gap: 1rem;

            button {
              background: var(--rainbow-red);
              padding: 1rem;
              font-weight: bold;
              font-size: 1.25rem;
            }

            * {
              margin: 0;
            }
          }
        }
      }
    }

    #pathway {
      background-color: var(--rainbow-red);
      padding: 4rem 0;

      .tiers {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1.5rem;
        margin-top: 2rem;

        article {
          border: 2px solid var(--fg-color);
          border-radius: var(--round-edge);
          filter: var(--shadow);
          background: var(--rainbow-red);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          color: var(--fg-color);

          .tier-label {
            align-self: flex-start;
            background-color: var(--text-color);
            color: var(--fg-color);
            font-family: var(--header-font);
            font-weight: bold;
            padding: 0.25rem 0.75rem;
            border-radius: var(--round-edge);
            text-transform: uppercase;
            font-size: 0.875rem;

            &.member {
              background-color: var(--rainbow-red);
              color: var(--fg-color);
              border: 1px solid var(--fg-color);
            }

            &.leader {
              background-color: var(--text-color);
              color: var(--fg-color);
            }
          }

          .trainings {
            font-size: 1rem;
            color: var(--fg-color);
            margin-top: auto;
          }
        }
      }
    }

    #cta {
      padding: 4rem 0;
      background-size: 2100px;

      .container {
        display: flex;
        justify-content: center;
      }

      .cta-button {
        display: block;
        background-color: var(--rainbow-red);
        color: var(--fg-color);
        padding: 1rem 2rem;
        border-radius: var(--round-edge);
        font-weight: bold;
        font-size: 1.25rem;
        text-align: center;
        text-decoration: none;
        transition: all 300ms;
        margin-top: 1.5rem;

        &:hover {
          filter: brightness(110%);
        }
      }
    }
  </style>
</Base>
`,

  "people-ops.astro": `---
import Base from "@templates/Base.astro";
import PageIntro from "@sections/PageIntro.astro";
import ruledBg from "@assets/img/ruled-bg.png";
import SectionBorder from "@components/SectionBorder.astro";
import Polaroid from "@components/Polaroid.astro";
import { faker } from "@faker-js/faker";
import { getImage } from "astro:assets";
import TornPaperBox from "@components/TornPaperBox.astro";
import handsWithHeart from "@assets/img/hands-with-heart.avif";

const ruledPaper = \`url(\${(await getImage({ src: ruledBg, format: "webp" })).src})\`;
const mvPhoto = faker.image.avatar();
---

<Base
  pageMetadata={{
    title: "People's Operations Core Track",
    description:
      "The People's Operations Track serves as the backbone of our community, focusing on member retention, engagement, and safety within PRISM.",
    type: "website",
    image: "https://picsum.photos/200",
    "image:alt": "People's Operations Core Track",
  }}
  class="page-content"
>
  <PageIntro
    title="People's Operations"
    description="The People's Operations Track serves as the backbone of our community, focusing on member retention, engagement, and safety. We are the architects of our internal culture, ensuring that every volunteer and member feels welcomed, supported, and connected to the broader PRISM mission through intentional communication and robust community management."
    image={handsWithHeart}
    pointBackTo={{ href: "/get-involved/", label: "Get Involved" }}
    class="intro"
  />

  <main>
    <SectionBorder type="marker" backgroundColor="activist-aqua" />

    <section id="staff" style={{ backgroundImage: ruledPaper }}>
      <div class="container">
        <h3>Meet the Organizing Director!</h3>
        <div class="content">
          <article>
            <div class="person">
              <Polaroid
                class="portrait"
                image={{
                  src: mvPhoto,
                  alt: "Portrait of MariaVictoria Chacon-Briceño",
                  format: "webp",
                  width: 300,
                  height: 300,
                }}
                label="MV Chacón-Briceño"
              />
            </div>
            <div class="description">
              <h4>Organizing Director</h4>
              <p>
                MariaVictoria is a queer, second-generation Venezuelan immigrant,
                born and raised in Miami, Florida. They earned a Bachelor of Arts
                in Political Science with a Double Minor in Public Administration
                and Anthropology from Florida International University. MV has
                been advocating and organizing in her community since 2018 on
                issues such as gun violence prevention, education equity, youth
                civic engagement, LGBTQ+ rights, and economic justice. She prides
                herself on being a continuous student to the practice of community
                organizing and is passionate about building relationships and
                developing the skills of her peers. When MV isn't organizing you
                can find them salsa dancing, reading in a hammock, or having
                philosophical conversations with anyone who will listen.
              </p>
              <button type="button">Read More About MV</button>
            </div>
          </article>
        </div>
      </div>
    </section>

    <SectionBorder type="marker" backgroundColor="activist-aqua" flip />

    <section id="pathway">
      <div class="container">
        <h3>How to Get Involved</h3>
        <p class="pathway-note">
          This track requires a deeper understanding of PRISM and more consistent
          engagement, and begins at the Member tier.
        </p>
        <div class="tiers">
          <article>
            <span class="tier-label member">Member</span>
            <p>
              Engages Discord members, phonebanks, conducts wellness checks, and
              recruits at mixers.
            </p>
            <p class="trainings">
              <strong>Trainings:</strong> Discord 101, Relational Organizing,
              Conflict De-escalation
            </p>
          </article>

          <article>
            <span class="tier-label leader">Leader</span>
            <p>
              Conducts intake 1:1s with new volunteers, co-facilitates
              Orientations, and/or moderates the Discord server.
            </p>
            <p class="trainings">
              <strong>Trainings:</strong> Advanced Facilitation, Crisis Management
            </p>
          </article>
        </div>
      </div>
    </section>

    <SectionBorder type="marker" backgroundColor="activist-aqua" />

    <section id="cta" style={{ backgroundImage: ruledPaper }}>
      <div class="container">
        <TornPaperBox>
          <h3>Help Build Our Community</h3>
          <p>
            Whether you're welcoming new members through intake calls, keeping our
            Discord a safe and vibrant space, or checking in on volunteers to make
            sure they feel cared for, every act of stewardship strengthens the
            foundation of our movement. Join People's Operations and help make
            PRISM a political home where everyone belongs.
          </p>
          <a href="/volunteer/" class="cta-button">
            Sign Up to Volunteer
          </a>
        </TornPaperBox>
      </div>
    </section>

    <SectionBorder type="marker" backgroundColor="activist-aqua" flip />
  </main>

  <style>
    .page-content {
      background-color: var(--activist-aqua);
    }

    main {
      margin: auto;
      font-size: 1.25rem;

      h2 {
        font-size: 2rem;
        text-align: center;
      }

      h3 {
        text-align: center;
        font-size: 1.75rem;
      }

      h4 {
        font-size: 1.5rem;
      }
    }

    .container {
      max-width: var(--xl);
      margin: auto;
      padding: 0 1rem;
    }

    #staff {
      padding: 4rem 0;
      background-size: 2100px;

      .content {
        max-width: var(--lg);
        display: flex;
        align-items: center;
        gap: 1rem;
        margin: auto;
        padding: 2rem 0;

        article {
          display: flex;
          gap: 1rem;

          .person {
            display: flex;
            flex-direction: column;

            .portrait {
              width: 220px;
              height: 250px;
              filter: var(--shadow);
            }

            .name {
              white-space: nowrap;
              font-family: var(--header-font);
              text-align: center;
            }
          }

          .description {
            display: flex;
            flex-direction: column;
            gap: 1rem;

            button {
              background: var(--activist-aqua);
              padding: 1rem;
              font-weight: bold;
              font-size: 1.25rem;
            }

            * {
              margin: 0;
            }
          }
        }
      }
    }

    #pathway {
      background-color: var(--activist-aqua);
      padding: 4rem 0;

      .pathway-note {
        text-align: center;
        font-style: italic;
        max-width: 600px;
        margin: 1rem auto 0;
        color: var(--fg-color);
      }

      .tiers {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1.5rem;
        margin-top: 2rem;
        max-width: 800px;
        margin-left: auto;
        margin-right: auto;

        article {
          border: 2px solid var(--fg-color);
          border-radius: var(--round-edge);
          filter: var(--shadow);
          background: var(--activist-aqua);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          color: var(--fg-color);

          .tier-label {
            align-self: flex-start;
            background-color: var(--text-color);
            color: var(--fg-color);
            font-family: var(--header-font);
            font-weight: bold;
            padding: 0.25rem 0.75rem;
            border-radius: var(--round-edge);
            text-transform: uppercase;
            font-size: 0.875rem;

            &.member {
              background-color: var(--activist-aqua);
              color: var(--fg-color);
              border: 1px solid var(--fg-color);
            }

            &.leader {
              background-color: var(--text-color);
              color: var(--fg-color);
            }
          }

          .trainings {
            font-size: 1rem;
            color: var(--fg-color);
            margin-top: auto;
          }
        }
      }
    }

    #cta {
      padding: 4rem 0;
      background-size: 2100px;

      .container {
        display: flex;
        justify-content: center;
      }

      .cta-button {
        display: block;
        background-color: var(--activist-aqua);
        color: var(--fg-color);
        padding: 1rem 2rem;
        border-radius: var(--round-edge);
        font-weight: bold;
        font-size: 1.25rem;
        text-align: center;
        text-decoration: none;
        transition: all 300ms;
        margin-top: 1.5rem;

        &:hover {
          filter: brightness(110%);
        }
      }
    }
  </style>
</Base>
`,

  "creative-fellowship.astro": `---
import Base from "@templates/Base.astro";
import PageIntro from "@sections/PageIntro.astro";
import ruledBg from "@assets/img/ruled-bg.png";
import SectionBorder from "@components/SectionBorder.astro";
import Polaroid from "@components/Polaroid.astro";
import { faker } from "@faker-js/faker";
import { getImage } from "astro:assets";
import TornPaperBox from "@components/TornPaperBox.astro";
import speech from "@assets/img/icons/Speech.png";

const ruledPaper = \`url(\${(await getImage({ src: ruledBg, format: "webp" })).src})\`;
const alexPhoto = faker.image.avatar();

const fellowshipRoles = [
  {
    title: "Policy Fellow",
    count: "3 (1 per county)",
    description:
      "Break down Florida legislation, school board meetings, elections, and current events into engaging, accessible stories that empower young people to understand policy and take action.",
    quota: "2 original pieces per month",
  },
  {
    title: "Community Fellow",
    count: "3 (1 per county)",
    description:
      "Capture PRISM in action through event coverage, interviews, photography, and storytelling that highlights our volunteers, community partners, and organizing efforts.",
    quota: "2 original pieces per month",
  },
  {
    title: "Health Fellow",
    count: "1",
    description:
      "Develop educational content focused on sexual health, HIV awareness, mental health, and community resources to make health information approachable, affirming, and accessible for young people.",
    quota: "2-3 original pieces per month",
  },
  {
    title: "Culture & Identity Fellow",
    count: "1",
    description:
      "Lead monthly cultural campaigns that celebrate LGBTQ+ identities, heritage months, Pride Days, history, and community stories that foster belonging and representation.",
    quota: "2-3 original pieces per month",
  },
  {
    title: "Copy Editor & Research Fellow",
    count: "1-2",
    description:
      "Ensure every piece of content is accurate, polished, and impactful by supporting research, fact-checking, copy editing, accessibility, and editorial consistency across PRISM's creative campaigns.",
    quota: "Edit ~16 pieces per month",
  },
  {
    title: "Design Fellow",
    count: "2",
    description:
      "Bring PRISM's campaigns to life through engaging visual content, graphic design, and visual storytelling across print and digital to strengthen our brand and support advocacy efforts.",
    quota: "3-4 visual assets per month",
  },
];
---

<Base
  pageMetadata={{
    title: "Creative Fellowship",
    description:
      "The PRISM Creative Fellowship is a 6-month volunteer leadership program for LGBTQ+ and allied students under 24 who are passionate about advocacy, organizing, and creative storytelling.",
    type: "website",
    image: "https://picsum.photos/200",
    "image:alt": "Creative Fellowship",
  }}
  class="page-content"
>
  <PageIntro
    title="Creative Fellowship"
    description="The PRISM Creative Fellowship is a 6-month volunteer leadership program designed for LGBTQ+ and allied students under the age of 24 who are passionate about advocacy, organizing, and creative storytelling. Fellows work alongside PRISM's team to create impactful content that educates, inspires, and mobilizes communities across South Florida."
    image={speech}
    pointBackTo={{ href: "/get-involved/", label: "Get Involved" }}
    class="intro"
  />

  <main>
    <SectionBorder type="marker" backgroundColor="rainbow-green" />

    <section id="staff" style={{ backgroundImage: ruledPaper }}>
      <div class="container">
        <h3>Meet the Content Creation Director!</h3>
        <div class="content">
          <article>
            <div class="person">
              <Polaroid
                class="portrait"
                image={{
                  src: alexPhoto,
                  alt: "Portrait of Alexander Puga",
                  format: "webp",
                  width: 300,
                  height: 300,
                }}
                label="Alexander Puga"
              />
            </div>
            <div class="description">
              <h4>Content Creation Director</h4>
              <p>
                A Miami-born creative with a passion for storytelling that
                uplifts and represents marginalized communities. With a background
                in film, content creation, and brand strategy, Alex brings bold
                visuals and culturally rooted narratives to life. He has led
                campaigns for local businesses, fashion brands, and queer
                initiatives. As Content Creation Director at PRISM, Alex is here
                to celebrate queer voices and create space for joy and identity
                across every platform. Outside of work, you'll find him biking
                around the city, sweating through a workout, singing, or hanging
                with his fiancé and their two pups, Nino and Winston.
              </p>
              <button type="button">Read More About Alex</button>
            </div>
          </article>
        </div>
      </div>
    </section>

    <SectionBorder type="marker" backgroundColor="rainbow-green" flip />

    <section id="roles">
      <div class="container">
        <h3>Fellowship Roles</h3>
        <div class="roles-grid">
          {
            fellowshipRoles.map((role) => (
              <article>
                <span class="role-label">{role.title}</span>
                <p class="count">{role.count} fellow{role.count !== "1" ? "s" : ""}</p>
                <p>{role.description}</p>
                <p class="quota">
                  <strong>Deliverables:</strong> {role.quota}
                </p>
              </article>
            ))
          }
        </div>
      </div>
    </section>

    <SectionBorder type="marker" backgroundColor="rainbow-green" />

    <section id="expectations" style={{ backgroundImage: ruledPaper }}>
      <div class="container">
        <TornPaperBox>
          <h3>What Fellows Gain</h3>
          <ul>
            <li>Serve in a 6-month volunteer leadership role</li>
            <li>Attend weekly Creative Fellowship meetings</li>
            <li>Participate in trainings, workshops, and educational seminars</li>
            <li>Build a professional portfolio through real-world advocacy campaigns</li>
            <li>Receive mentorship from nonprofit professionals and community leaders</li>
            <li>Join PRISM's growing network of organizers, advocates, and changemakers</li>
          </ul>
          <h3>Eligibility</h3>
          <ul>
            <li>Be a current high school or college student (or equivalent)</li>
            <li>Be 24 years old or younger at the start of the Fellowship</li>
            <li>Live in Miami, Broward, or Palm Beach County</li>
            <li>Have a demonstrated connection to LGBTQ+ youth organizing in Florida</li>
            <li>Be able to commit to the full 6-month Fellowship</li>
          </ul>
        </TornPaperBox>
      </div>
    </section>

    <SectionBorder type="marker" backgroundColor="rainbow-green" flip />

    <section id="cta" style={{ backgroundImage: ruledPaper }}>
      <div class="container">
        <TornPaperBox>
          <h3>Apply for the Creative Fellowship</h3>
          <p>
            Whether you're passionate about writing, photography, graphic design,
            video production, or social media, there's a place for you in the
            Creative Fellowship. Build your portfolio, develop your voice, and
            help shape PRISM's message while growing as a leader and storyteller.
          </p>
          <a href="/apply/creative-fellowship/" class="cta-button">
            Apply Now
          </a>
        </TornPaperBox>
      </div>
    </section>

    <SectionBorder type="marker" backgroundColor="rainbow-green" />
  </main>

  <style>
    .page-content {
      background-color: var(--rainbow-green);
    }

    main {
      margin: auto;
      font-size: 1.25rem;

      h2 {
        font-size: 2rem;
        text-align: center;
      }

      h3 {
        text-align: center;
        font-size: 1.75rem;
      }

      h4 {
        font-size: 1.5rem;
      }
    }

    .container {
      max-width: var(--xl);
      margin: auto;
      padding: 0 1rem;
    }

    #staff {
      padding: 4rem 0;
      background-size: 2100px;

      .content {
        max-width: var(--lg);
        display: flex;
        align-items: center;
        gap: 1rem;
        margin: auto;
        padding: 2rem 0;

        article {
          display: flex;
          gap: 1rem;

          .person {
            display: flex;
            flex-direction: column;

            .portrait {
              width: 220px;
              height: 250px;
              filter: var(--shadow);
            }

            .name {
              white-space: nowrap;
              font-family: var(--header-font);
              text-align: center;
            }
          }

          .description {
            display: flex;
            flex-direction: column;
            gap: 1rem;

            button {
              background: var(--rainbow-green);
              padding: 1rem;
              font-weight: bold;
              font-size: 1.25rem;
            }

            * {
              margin: 0;
            }
          }
        }
      }
    }

    #roles {
      background-color: var(--rainbow-green);
      padding: 4rem 0;

      .roles-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1.5rem;
        margin-top: 2rem;

        article {
          border: 2px solid var(--fg-color);
          border-radius: var(--round-edge);
          filter: var(--shadow);
          background: var(--rainbow-green);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          color: var(--fg-color);

          .role-label {
            align-self: flex-start;
            background-color: var(--text-color);
            color: var(--fg-color);
            font-family: var(--header-font);
            font-weight: bold;
            padding: 0.25rem 0.75rem;
            border-radius: var(--round-edge);
            text-transform: uppercase;
            font-size: 0.875rem;
          }

          .count {
            font-weight: 600;
            margin: 0;
          }

          .quota {
            font-size: 1rem;
            margin-top: auto;
          }
        }
      }
    }

    #expectations {
      padding: 4rem 0;
      background-size: 2100px;

      .container {
        display: flex;
        justify-content: center;
      }

      h3 {
        color: var(--text-color);
      }

      ul {
        list-style: disc;
        padding-left: 1.5rem;
        color: var(--text-color);
        line-height: 1.8;
      }
    }

    #cta {
      padding: 4rem 0;
      background-size: 2100px;

      .container {
        display: flex;
        justify-content: center;
      }

      .cta-button {
        display: block;
        background-color: var(--rainbow-green);
        color: var(--fg-color);
        padding: 1rem 2rem;
        border-radius: var(--round-edge);
        font-weight: bold;
        font-size: 1.25rem;
        text-align: center;
        text-decoration: none;
        transition: all 300ms;
        margin-top: 1.5rem;

        &:hover {
          filter: brightness(110%);
        }
      }
    }
  </style>
</Base>
`,

  "yac.astro": `---
import Base from "@templates/Base.astro";
import PageIntro from "@sections/PageIntro.astro";
import ruledBg from "@assets/img/ruled-bg.png";
import SectionBorder from "@components/SectionBorder.astro";
import Polaroid from "@components/Polaroid.astro";
import { faker } from "@faker-js/faker";
import { getImage } from "astro:assets";
import TornPaperBox from "@components/TornPaperBox.astro";
import fist1 from "@assets/img/stickers/fist_1-sticker.png";

const ruledPaper = \`url(\${(await getImage({ src: ruledBg, format: "webp" })).src})\`;
const maxxPhoto = faker.image.avatar();
---

<Base
  pageMetadata={{
    title: "Youth Advisory Committee",
    description:
      "The Youth Advisory Committee (YAC) is a 9-month program for nonprofit governance and board recommendations, empowering the next generation of LGBTQ+ leaders in South Florida.",
    type: "website",
    image: "https://picsum.photos/200",
    "image:alt": "Youth Advisory Committee",
  }}
  class="page-content"
>
  <PageIntro
    title="Youth Advisory Committee"
    description="The Youth Advisory Committee (YAC) is a 9-month program designed to develop the next generation of LGBTQ+ nonprofit leaders. YAC members gain hands-on experience in nonprofit governance, strategic planning, and board leadership while making real recommendations that shape PRISM's direction and impact across South Florida."
    image={fist1}
    pointBackTo={{ href: "/get-involved/", label: "Get Involved" }}
    class="intro"
  />

  <main>
    <SectionBorder type="marker" backgroundColor="youth-yellow-2" />

    <section id="staff" style={{ backgroundImage: ruledPaper }}>
      <div class="container">
        <h3>Meet the Executive Director!</h3>
        <div class="content">
          <article>
            <div class="person">
              <Polaroid
                class="portrait"
                image={{
                  src: maxxPhoto,
                  alt: "Portrait of Maxx Fenning",
                  format: "webp",
                  width: 300,
                  height: 300,
                }}
                label="Maxx Fenning"
              />
            </div>
            <div class="description">
              <h4>Executive Director</h4>
              <p>
                A staunch advocate for LGBTQ+ rights and sexual health education,
                Maxx is the Executive Director of PRISM. He recently earned his
                degree in Business Administration from the University of Florida,
                and is now pursuing a Master of Public Policy at the University
                of Miami. He is also an active creator on TikTok, where he
                educates on many of the same topics that PRISM addresses. In his
                free time, Maxx enjoys singing and graphic design.
              </p>
              <button type="button">Read More About Maxx</button>
            </div>
          </article>
        </div>
      </div>
    </section>

    <SectionBorder type="marker" backgroundColor="youth-yellow-2" flip />

    <section id="program">
      <div class="container">
        <h3>What is the YAC?</h3>
        <div class="program-content">
          <TornPaperBox>
            <p>
              The Youth Advisory Committee serves as a bridge between PRISM's
              youth members and its Board of Directors. Over the course of 9
              months, YAC members develop a deep understanding of nonprofit
              governance, organizational strategy, and community-led
              decision-making.
            </p>
            <h4>Key Components</h4>
            <ul>
              <li>Attend monthly YAC meetings with the YAC Chair and Executive Director</li>
              <li>Review board governance and strategy</li>
              <li>Make real recommendations that shape PRISM's organizational direction</li>
              <li>Develop leadership skills in nonprofit management and governance</li>
              <li>Connect with PRISM's Board of Directors and community partners</li>
            </ul>
          </TornPaperBox>
        </div>
      </div>
    </section>

    <SectionBorder type="marker" backgroundColor="youth-yellow-2" />

    <section id="cta" style={{ backgroundImage: ruledPaper }}>
      <div class="container">
        <TornPaperBox>
          <h3>Shape the Future of PRISM</h3>
          <p>
            The Youth Advisory Committee is where young leaders gain real
            governance experience and make decisions that matter. If you're
            passionate about nonprofit leadership, organizational strategy, and
            ensuring that youth voices guide our movement, the YAC is your
            opportunity to step up and lead from within.
          </p>
          <a href="/apply/yac/" class="cta-button">
            Apply to the YAC
          </a>
        </TornPaperBox>
      </div>
    </section>

    <SectionBorder type="marker" backgroundColor="youth-yellow-2" flip />
  </main>

  <style>
    .page-content {
      background-color: var(--youth-yellow-2);
    }

    main {
      margin: auto;
      font-size: 1.25rem;

      h2 {
        font-size: 2rem;
        text-align: center;
      }

      h3 {
        text-align: center;
        font-size: 1.75rem;
      }

      h4 {
        font-size: 1.5rem;
      }
    }

    .container {
      max-width: var(--xl);
      margin: auto;
      padding: 0 1rem;
    }

    #staff {
      padding: 4rem 0;
      background-size: 2100px;

      .content {
        max-width: var(--lg);
        display: flex;
        align-items: center;
        gap: 1rem;
        margin: auto;
        padding: 2rem 0;

        article {
          display: flex;
          gap: 1rem;

          .person {
            display: flex;
            flex-direction: column;

            .portrait {
              width: 220px;
              height: 250px;
              filter: var(--shadow);
            }

            .name {
              white-space: nowrap;
              font-family: var(--header-font);
              text-align: center;
            }
          }

          .description {
            display: flex;
            flex-direction: column;
            gap: 1rem;

            button {
              background: var(--youth-yellow-2);
              padding: 1rem;
              font-weight: bold;
              font-size: 1.25rem;
            }

            * {
              margin: 0;
            }
          }
        }
      }
    }

    #program {
      background-color: var(--youth-yellow-2);
      padding: 4rem 0;

      .program-content {
        display: flex;
        justify-content: center;
        margin-top: 2rem;
      }

      h4 {
        color: var(--text-color);
      }

      ul {
        list-style: disc;
        padding-left: 1.5rem;
        color: var(--text-color);
        line-height: 1.8;
      }
    }

    #cta {
      padding: 4rem 0;
      background-size: 2100px;

      .container {
        display: flex;
        justify-content: center;
      }

      .cta-button {
        display: block;
        background-color: var(--youth-yellow-2);
        color: var(--text-color);
        padding: 1rem 2rem;
        border-radius: var(--round-edge);
        font-weight: bold;
        font-size: 1.25rem;
        text-align: center;
        text-decoration: none;
        transition: all 300ms;
        margin-top: 1.5rem;

        &:hover {
          filter: brightness(110%);
        }
      }
    }
  </style>
</Base>
`,
};

for (const [filename, content] of Object.entries(pages)) {
  const filePath = path.join(pagesDir, filename);
  fs.writeFileSync(filePath, content, "utf-8");
  console.log(`Created ${filePath}`);
}

console.log("\nDone! All 4 pages created in src/pages/.");
