/*
 * sample-data.js
 * Sample LibertyCES deliverables packet for the Sovereign Strategy Deliverables Dashboard.
 *
 * This is example/default data only. The dashboard itself is universal and is NOT
 * hardcoded around filtration or LibertyCES. Replace this file (or just click
 * "Clear Dashboard" and import your own packet) to use it for any business.
 *
 * The dashboard reads `window.SAMPLE_DELIVERABLES` when you click "Load Sample".
 */

window.SAMPLE_DELIVERABLES = {
  meta: {
    client: "LibertyCES",
    project: "Industrial Filtration SEO/GEO/AEO Plan",
    topic: "Catalytic carbon, cartridge housings, sediment filtration, RO pre-treatment, differential pressure monitoring",
    created_by: "Claude",
    notes: "Dashboard-ready deliverables only. Sample data."
  },
  deliverables: [
    {
      platform: "Webpage",
      deliverable_type: "Authority Page",
      priority: "Build First",
      status: "Idea",
      deliverable: "Catalytic Carbon vs Activated Carbon Chloramine Removal Page",
      angle: "Standard activated carbon is the wrong upstream media spec when municipal feedwater uses chloramines.",
      seo_focus: ["catalytic carbon filter", "activated carbon vs catalytic carbon", "chloramine removal filter"],
      geo_focus: ["What type of carbon filter removes chloramines?", "Why does activated carbon fail on chloraminated water?"],
      aeo_focus: ["Does activated carbon remove chloramines?", "When should catalytic carbon be used?"],
      context_blueprint: "Create an authority page that explains the failure mode, shows why cartridges and RO membranes fail downstream, and positions LibertyCES as the spec partner for correcting the filtration train. Keep it focused on commercial and municipal feedwater intent.",
      notes: "Use this as the main authority asset."
    },
    {
      platform: "Product Page",
      deliverable_type: "Equipment Spec Page",
      priority: "Build First",
      status: "Idea",
      deliverable: "Big Blue Cartridge Housing Selection Page",
      angle: "Buyers pick the wrong housing size and flow rating, then under-perform and over-replace cartridges.",
      seo_focus: ["big blue filter housing", "20 inch cartridge housing", "industrial filter housing"],
      geo_focus: ["What size cartridge housing do I need?", "How do I match flow rate to a filter housing?"],
      aeo_focus: ["What is a big blue filter housing used for?", "How many GPM does a 20 inch housing handle?"],
      context_blueprint: "Build a spec-driven product page that maps housing size to flow rate, port size, and micron staging. Position LibertyCES as the partner who specs the full housing-plus-cartridge train, not just a parts reseller.",
      notes: ""
    },
    {
      platform: "Blog",
      deliverable_type: "Problem/Solution Article",
      priority: "Build Second",
      status: "Idea",
      deliverable: "Why Your Sediment Filters Clog Too Fast (Micron Staging Guide)",
      angle: "Single-stage sediment filtration burns through cartridges; staged micron loading is the fix.",
      seo_focus: ["sediment filter clogging", "micron staging", "sediment pre-filter"],
      geo_focus: ["Why do sediment filters clog so fast?", "What micron sequence should a pre-filter use?"],
      aeo_focus: ["How often should you change a sediment filter?", "What does micron staging mean?"],
      context_blueprint: "Explain cartridge loading, dirt-holding capacity, and staged micron sequencing (e.g., 50 → 20 → 5). Tie it back to total cost of ownership and a LibertyCES spec review offer.",
      notes: ""
    },
    {
      platform: "YouTube / NotebookLM Video",
      deliverable_type: "Explainer Video",
      priority: "Build Second",
      status: "Idea",
      deliverable: "RO Pre-Treatment Explained in 6 Minutes",
      angle: "Most RO membrane failures are pre-treatment failures, not membrane defects.",
      seo_focus: ["RO pre-treatment", "reverse osmosis membrane protection", "RO feedwater requirements"],
      geo_focus: ["What is RO pre-treatment?", "Why do RO membranes fail early?"],
      aeo_focus: ["What protects an RO membrane?", "Do you need a carbon filter before RO?"],
      context_blueprint: "Script a tight explainer covering sediment, carbon, and chlorine/chloramine protection ahead of the membrane. End with a LibertyCES pre-treatment spec checklist call to action.",
      notes: "Repurpose script into NotebookLM audio overview."
    },
    {
      platform: "Instagram Video",
      deliverable_type: "Short-Form Reel",
      priority: "Build Later",
      status: "Idea",
      deliverable: "60-Second: The Filter Mistake That Kills RO Membranes",
      angle: "One overlooked carbon stage quietly destroys expensive membranes.",
      seo_focus: ["RO membrane", "chlorine damage RO"],
      geo_focus: ["What ruins RO membranes?"],
      aeo_focus: ["Does chlorine damage RO membranes?"],
      context_blueprint: "Fast hook + single visual of a degraded membrane vs protected membrane. Drive to the authority page. Keep it punchy and spec-credible, not consumer-fluffy.",
      notes: ""
    },
    {
      platform: "Instagram Carousel",
      deliverable_type: "Educational Carousel",
      priority: "Build Later",
      status: "Idea",
      deliverable: "5 Signs Your Filtration Train Is Mis-Spec'd",
      angle: "Operators tolerate symptoms that are actually spec errors.",
      seo_focus: ["filtration system problems", "water filtration train"],
      geo_focus: ["How do I know if my filtration system is wrong?"],
      aeo_focus: ["What are signs of a bad water filter setup?"],
      context_blueprint: "Five-slide diagnostic: short cartridge life, pressure drop, taste/odor breakthrough, membrane fouling, inconsistent flow. Final slide offers a LibertyCES spec review.",
      notes: ""
    },
    {
      platform: "LinkedIn Carousel",
      deliverable_type: "B2B Authority Carousel",
      priority: "Build Second",
      status: "Idea",
      deliverable: "Differential Pressure Monitoring: The KPI Most Plants Ignore",
      angle: "Differential pressure is the cheapest early-warning system in the plant, and it's usually un-instrumented.",
      seo_focus: ["differential pressure monitoring", "filter pressure drop", "DP gauge filtration"],
      geo_focus: ["What is differential pressure in filtration?", "When should you change a filter based on pressure?"],
      aeo_focus: ["What is a normal pressure drop across a filter?", "Why monitor differential pressure?"],
      context_blueprint: "Build a B2B carousel for plant and facility engineers showing how DP trending predicts cartridge change-outs and prevents unplanned downtime. Close with a LibertyCES instrumentation spec offer.",
      notes: ""
    },
    {
      platform: "LinkedIn James Post",
      deliverable_type: "Founder Insight Post",
      priority: "Build First",
      status: "Idea",
      deliverable: "James Post: The $40k Membrane Failure That Was a $200 Carbon Problem",
      angle: "A real-feeling field story that reframes membrane cost as a pre-treatment spec decision.",
      seo_focus: ["RO membrane failure", "pre-treatment cost"],
      geo_focus: ["What causes expensive RO membrane failures?"],
      aeo_focus: ["How do you prevent RO membrane failure?"],
      context_blueprint: "Write a first-person James narrative post: walked into a plant, found the missing carbon stage, quantified the cost. Position LibertyCES as the team that specs the whole train. Conversational, credible, no hype.",
      notes: "Founder voice — keep it human."
    },
    {
      platform: "LinkedIn LibertyCES Post",
      deliverable_type: "Company Authority Post",
      priority: "Build Second",
      status: "Idea",
      deliverable: "LibertyCES Post: How We Spec a Filtration Train From Feedwater to Finish",
      angle: "Show the methodology, not just the products.",
      seo_focus: ["filtration system design", "water treatment specification"],
      geo_focus: ["How do you design a water filtration system?"],
      aeo_focus: ["What is a filtration train?"],
      context_blueprint: "Company-voice post outlining the LibertyCES spec process: feedwater analysis, contaminant targets, staged media, instrumentation, and service plan. Establishes process authority for commercial and municipal buyers.",
      notes: ""
    },
    {
      platform: "LinkedIn Newsletter",
      deliverable_type: "Long-Form Newsletter",
      priority: "Build Later",
      status: "Idea",
      deliverable: "The Spec Sheet: Edition 1 — Carbon Media Done Right",
      angle: "A recurring newsletter that makes LibertyCES the standing reference for filtration spec decisions.",
      seo_focus: ["carbon media filtration", "GAC vs catalytic carbon", "water treatment newsletter"],
      geo_focus: ["What is the difference between GAC and catalytic carbon?", "When do you use catalytic carbon?"],
      aeo_focus: ["What is granular activated carbon used for?", "Is catalytic carbon better than activated carbon?"],
      context_blueprint: "Launch a recurring newsletter franchise. Edition 1 covers carbon media selection (GAC, catalytic, contact time, EBCT). Each edition ends with a practical spec takeaway and a LibertyCES consult offer.",
      notes: "First edition of a recurring series."
    },
    {
      platform: "Webpage",
      deliverable_type: "Comparison Page",
      priority: "Build Second",
      status: "Idea",
      deliverable: "Bag Filters vs Cartridge Filters for Industrial Flow",
      angle: "Buyers default to cartridges when bag filters are the better economic and operational fit at high flow.",
      seo_focus: ["bag filter vs cartridge filter", "industrial bag filtration", "high flow filtration"],
      geo_focus: ["When should you use a bag filter instead of a cartridge?", "Are bag filters cheaper than cartridges?"],
      aeo_focus: ["What is a bag filter used for?", "Bag filter vs cartridge filter — which is better?"],
      context_blueprint: "Comparison page mapping flow rate, dirt-holding capacity, change-out labor, and cost per gallon. Help the buyer self-select, then offer a LibertyCES sizing review for borderline cases.",
      notes: ""
    },
    {
      platform: "Product Page",
      deliverable_type: "Equipment Spec Page",
      priority: "Build Later",
      status: "Idea",
      deliverable: "Differential Pressure Gauge & Switch Kit Page",
      angle: "Instrumentation is sold as an afterthought when it should be specced with the housing.",
      seo_focus: ["differential pressure gauge", "DP switch filtration", "filter pressure gauge kit"],
      geo_focus: ["What gauge do I need for my filter housing?"],
      aeo_focus: ["How does a differential pressure switch work?"],
      context_blueprint: "Product page bundling DP gauge/switch hardware with the housing spec, framed around predictive change-outs and downtime avoidance. Tie to the DP monitoring carousel and authority content.",
      notes: ""
    }
  ]
};
