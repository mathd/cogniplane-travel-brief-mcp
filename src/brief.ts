// The preference tree and the brief text built from it. The server, the UI and
// the tests all import this file, so the words stay the same everywhere.

export interface Idea {
  id: string;
  label: string;
  weight: number;
  children: Idea[];
}

export const idea = (id: string, label: string, weight: number, children: Idea[] = []): Idea => ({ id, label, weight, children });

export const PREFERENCE_TREE = idea("root", "All ideas", 0, [
  idea("culture", "Culture", 20, [
    idea("architecture", "Architecture", 19, [
      idea("ancient-sites", "Ancient sites", 18),
      idea("modernism", "Modernism", 13),
      idea("local-design", "Local design", 10),
      idea("sacred-buildings", "Sacred buildings", 8),
    ]),
    idea("art", "Art", 15, [
      idea("major-museums", "Major museums", 17),
      idea("small-galleries", "Small galleries", 12),
      idea("studio-visits", "Studio visits", 9),
      idea("public-art", "Public art", 7),
    ]),
    idea("history", "History", 12, [
      idea("archaeology", "Archaeology", 17),
      idea("living-history", "Living history", 11),
      idea("industrial-heritage", "Industrial heritage", 8),
      idea("local-historian", "Local historian", 7),
    ]),
    idea("traditions", "Traditions", 9, [
      idea("festivals", "Festivals", 16),
      idea("craft-workshops", "Craft workshops", 12),
      idea("ceremonies", "Ceremonies", 8),
      idea("community-guides", "Community guides", 7),
    ]),
  ]),
  idea("coast", "Coast", 18, [
    idea("beaches", "Beaches", 20, [
      idea("quiet-coves", "Quiet coves", 18),
      idea("swimmable-water", "Swimmable water", 14),
      idea("long-sand", "Long sandy beach", 10),
      idea("sunset-coast", "Sunset coast", 8),
    ]),
    idea("islands", "Islands", 16, [
      idea("island-hopping", "Island hopping", 18),
      idea("car-free-island", "Car-free island", 12),
      idea("remote-island", "Remote island", 9),
      idea("one-island", "One island base", 8),
    ]),
    idea("sailing", "Sailing", 12, [
      idea("crewed-charter", "Crewed charter", 17),
      idea("day-sails", "Day sails", 12),
      idea("learn-to-sail", "Learn to sail", 9),
      idea("marina-life", "Marina life", 7),
    ]),
    idea("coastal-towns", "Coastal towns", 10, [
      idea("fishing-villages", "Fishing villages", 16),
      idea("promenades", "Promenades", 11),
      idea("waterfront-dining", "Waterfront dining", 10),
      idea("working-harbours", "Working harbours", 7),
    ]),
  ]),
  idea("food", "Food", 17, [
    idea("markets", "Markets", 19, [
      idea("morning-markets", "Morning markets", 17),
      idea("street-food", "Street food", 14),
      idea("market-guide", "Market guide", 10),
      idea("regional-produce", "Regional produce", 8),
    ]),
    idea("wine", "Wine", 15, [
      idea("winery-stays", "Winery stays", 17),
      idea("private-tastings", "Private tastings", 13),
      idea("harvest-season", "Harvest season", 9),
      idea("natural-wine", "Natural wine", 8),
    ]),
    idea("restaurants", "Restaurants", 13, [
      idea("chef-tables", "Chef tables", 17),
      idea("local-institutions", "Local institutions", 12),
      idea("casual-dining", "Casual dining", 10),
      idea("tasting-menus", "Tasting menus", 8),
    ]),
    idea("cooking", "Cooking", 9, [
      idea("hands-on-class", "Hands-on class", 16),
      idea("private-chef", "Private chef", 12),
      idea("farm-visit", "Farm visit", 10),
      idea("family-recipes", "Family recipes", 7),
    ]),
  ]),
  idea("nature", "Nature", 15, [
    idea("mountains", "Mountains", 19, [
      idea("gentle-trails", "Gentle trails", 16),
      idea("full-day-hikes", "Full-day hikes", 13),
      idea("alpine-stays", "Alpine stays", 11),
      idea("scenic-lifts", "Scenic lifts", 8),
    ]),
    idea("wildlife", "Wildlife", 15, [
      idea("safari", "Safari", 17),
      idea("birding", "Birding", 11),
      idea("marine-life", "Marine life", 10),
      idea("conservation", "Conservation", 8),
    ]),
    idea("forests", "Forests", 11, [
      idea("forest-lodge", "Forest lodge", 16),
      idea("canopy-walks", "Canopy walks", 11),
      idea("waterfalls", "Waterfalls", 9),
      idea("guided-walks", "Guided walks", 8),
    ]),
    idea("desert", "Desert", 8, [
      idea("desert-camp", "Desert camp", 16),
      idea("stargazing", "Stargazing", 13),
      idea("oasis", "Oasis", 9),
      idea("dune-drive", "Dune drive", 7),
    ]),
  ]),
  idea("adventure", "Adventure", 14, [
    idea("hiking", "Hiking", 19, [
      idea("day-hikes", "Day hikes", 17),
      idea("multi-day-trek", "Multi-day trek", 13),
      idea("hut-to-hut", "Hut to hut", 10),
      idea("private-trail-guide", "Private trail guide", 8),
    ]),
    idea("water-sports", "Water sports", 14, [
      idea("kayaking", "Kayaking", 17),
      idea("surfing", "Surfing", 12),
      idea("snorkelling", "Snorkelling", 10),
      idea("rafting", "Rafting", 8),
    ]),
    idea("cycling", "Cycling", 11, [
      idea("e-bikes", "E-bikes", 16),
      idea("road-cycling", "Road cycling", 11),
      idea("rail-trails", "Rail trails", 9),
      idea("bike-and-barge", "Bike and barge", 7),
    ]),
    idea("expedition", "Expedition", 8, [
      idea("polar-voyage", "Polar voyage", 16),
      idea("remote-camp", "Remote camp", 11),
      idea("small-ship", "Small ship", 10),
      idea("expert-led", "Expert led", 8),
    ]),
  ]),
  idea("city", "City life", 13, [
    idea("neighbourhoods", "Neighbourhoods", 18, [
      idea("local-cafes", "Local cafes", 16),
      idea("independent-shops", "Independent shops", 12),
      idea("street-life", "Street life", 10),
      idea("residential-stay", "Residential stay", 7),
    ]),
    idea("landmarks", "Landmarks", 14, [
      idea("private-access", "Private access", 16),
      idea("early-entry", "Early entry", 12),
      idea("architect-guide", "Architect guide", 9),
      idea("night-visit", "Night visit", 7),
    ]),
    idea("shopping", "Shopping", 9, [
      idea("design-stores", "Design stores", 16),
      idea("antiques", "Antiques", 12),
      idea("local-fashion", "Local fashion", 9),
      idea("food-shops", "Food shops", 8),
    ]),
    idea("performances", "Performances", 8, [
      idea("opera", "Opera", 15),
      idea("theatre", "Theatre", 12),
      idea("concerts", "Concerts", 10),
      idea("dance", "Dance", 8),
    ]),
  ]),
  idea("slow", "Slow travel", 12, [
    idea("long-stays", "Long stays", 18, [
      idea("one-base", "One home base", 16),
      idea("weekly-rhythm", "Weekly rhythm", 11),
      idea("work-friendly", "Work friendly", 9),
      idea("language-study", "Language study", 7),
    ]),
    idea("rail", "Rail journeys", 15, [
      idea("scenic-trains", "Scenic trains", 17),
      idea("night-trains", "Night trains", 12),
      idea("few-transfers", "Few transfers", 10),
      idea("first-class-rail", "First-class rail", 8),
    ]),
    idea("countryside", "Countryside", 11, [
      idea("farmhouse", "Farmhouse", 16),
      idea("village-base", "Village base", 12),
      idea("rural-drives", "Rural drives", 9),
      idea("local-host", "Local host", 7),
    ]),
  ]),
  idea("wellness", "Wellness", 10, [
    idea("spa", "Spa", 18, [
      idea("destination-spa", "Destination spa", 16),
      idea("daily-treatment", "Daily treatments", 12),
      idea("thermal-baths", "Thermal baths", 10),
      idea("medical-wellness", "Medical wellness", 7),
    ]),
    idea("quiet", "Quiet", 15, [
      idea("digital-detox", "Digital detox", 16),
      idea("adults-only", "Adults only", 11),
      idea("private-space", "Private space", 10),
      idea("nature-sounds", "Nature sounds", 7),
    ]),
    idea("movement", "Movement", 9, [
      idea("yoga", "Yoga", 16),
      idea("pilates", "Pilates", 11),
      idea("swimming", "Swimming", 9),
      idea("guided-fitness", "Guided fitness", 7),
    ]),
  ]),
  idea("romance", "Romance", 9, [
    idea("privacy", "Privacy", 18, [
      idea("private-villa", "Private villa", 16),
      idea("secluded-suite", "Secluded suite", 12),
      idea("private-pool", "Private pool", 10),
      idea("quiet-dining", "Quiet dining", 7),
    ]),
    idea("celebration", "Celebration", 14, [
      idea("honeymoon", "Honeymoon", 16),
      idea("anniversary", "Anniversary", 12),
      idea("proposal", "Proposal", 10),
      idea("milestone", "Milestone", 7),
    ]),
    idea("small-luxuries", "Small luxuries", 10, [
      idea("room-upgrade", "Room upgrade", 15),
      idea("special-dinner", "Special dinner", 12),
      idea("spa-for-two", "Spa for two", 9),
      idea("sunset-cruise", "Sunset cruise", 8),
    ]),
  ]),
  idea("nightlife", "Nightlife", 8, [
    idea("music", "Live music", 18, [
      idea("jazz-clubs", "Jazz clubs", 16),
      idea("concert-halls", "Concert halls", 11),
      idea("local-bands", "Local bands", 9),
      idea("late-shows", "Late shows", 7),
    ]),
    idea("bars", "Bars", 14, [
      idea("cocktail-bars", "Cocktail bars", 16),
      idea("wine-bars", "Wine bars", 12),
      idea("rooftops", "Rooftops", 9),
      idea("neighbourhood-pubs", "Neighbourhood pubs", 7),
    ]),
    idea("late-nights", "Late nights", 10, [
      idea("late-dining", "Late dining", 15),
      idea("dancing", "Dancing", 12),
      idea("night-markets", "Night markets", 9),
      idea("after-hours-tour", "After-hours tour", 7),
    ]),
  ]),
]);

export interface Brief {
  party: string;
  travellers: number;
  destination: string;
  budget: string;
  preferences: string[];
}

export function briefText(b: Brief): string {
  return [
    "Atlas trip brief",
    `Travel party: ${b.party || "Open"}`,
    `Number of people: ${b.travellers}`,
    `Destination: ${b.destination || "Not set"}`,
    `Budget per person: ${b.budget || "Not set"}`,
    `Preferences: ${b.preferences.join(", ") || "Open"}`,
  ].join("\n");
}

export function briefMessage(b: Brief): string {
  return (
    "Draft a short trip proposal from this brief. Suggest two itinerary options, " +
    "keep each under 120 words, and list the questions I should ask the client next.\n\n" +
    briefText(b)
  );
}

export function toolSummary(): string {
  const themes = PREFERENCE_TREE.children.map((c) => c.label).join(", ");
  return [
    "Opened the Atlas travel brief builder.",
    "The advisor sets the travel party, destination and budget per person, then follows a word cloud from broad themes to precise preferences.",
    `Top-level themes: ${themes}.`,
    "When the advisor sends the brief, the app posts it to the chat as a user message that asks for a trip proposal.",
  ].join("\n");
}
