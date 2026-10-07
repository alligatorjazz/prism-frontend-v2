export const siteBreakpoints = {
  xs: 576,
  sm: 768,
  md: 992,
  lg: 1200,
  xl: 1400,
};

export const globalRoutes: Route[] = [
  {
    type: "internal",
    path: "/about",
    displayName: "About",
    children: [
      { type: "internal", path: "/our-history", displayName: "Our History" },
      { type: "internal", path: "/our-team", displayName: "Our Team" },
      { type: "internal", path: "/our-partners", displayName: "Our Partners" },
      {
        type: "internal",
        path: "/news-and-press",
        displayName: "News & Press",
      },
    ],
  },
  {
    type: "internal",
    path: "/get-involved",
    displayName: "Get Involved",
    children: [
      { type: "internal", path: "/outreach", displayName: "Outreach" },
      {
        type: "internal",
        path: "/creative-fellowship",
        displayName: "Creative Fellowship",
      },
      { type: "internal", path: "/policy", displayName: "Policy" },
      { type: "internal", path: "/people-ops", displayName: "People Ops" },
      {
        type: "internal",
        path: "/psap",
        displayName: "Student Ambassador Program",
      },
      {
        type: "external",
        url: "https://discord.gg/nHuWYXkpr6",
        displayName: "Discord",
      },
    ],
  },
  {
    type: "internal",
    path: "/resources",
    displayName: "Resources",
    children: [
      {
        type: "internal",
        path: "/sti-clinic-search",
        displayName: "STI Clinic Search",
      },

      {
        type: "internal",
        path: "/policy-hub",
        displayName: "School Policy Hub",
      },
      { type: "internal", path: "/learn", displayName: "Learn" },
    ],
  },
  {
    type: "internal",
    path: "/donate",
    displayName: "Donate",
    highlight: true,
    children: [
      {
        type: "internal",
        path: "/movement-builders-monthly",
        displayName: "Monthly Giving",
      },
      {
        type: "internal",
        path: "/movement-builders-yearly",
        displayName: "Yearly Giving",
      },
      {
        type: "internal",
        path: "/movement-builders-business",
        displayName: "Business Sponsorship",
      },
    ],
  },
];
