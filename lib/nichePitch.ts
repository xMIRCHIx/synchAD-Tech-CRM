export interface NicheStrategy {
  nicheType:
    | 'real_estate'
    | 'ca_finance'
    | 'clinic_doctor'
    | 'coaching_education'
    | 'restaurant_cafe'
    | 'hospitality_hotel'
    | 'gym_fitness'
    | 'interior_architecture'
    | 'salon_beauty'
    | 'generic'
  nicheLabel: string
  situation: string
  angle: string
  badgeColor: string
  tagBg: string
  textColor: string
  whyPitch: string
  recommendedSolution: string
  defaultHook: string
}

export interface PitchContext {
  businessName?: string | null
  ownerName?: string | null
  niche?: string | null
  address?: string | null
  websiteUrl?: string | null
  siteState?: 'exists' | 'none' | 'broken' | string | null
  googleRating?: number | string | null
  senderName?: string | null
  includeSenderName?: boolean
}

export function detectNicheType(rawNiche?: string | null, rawBusiness?: string | null, notes?: string | null): {
  type: NicheStrategy['nicheType']
  label: string
} {
  const text = `${rawNiche || ''} ${rawBusiness || ''} ${notes || ''}`.toLowerCase()

  if (/real\s*estate|property|builder|broker|flat|plot|housing|colonizer|realtor|estate agent/i.test(text)) {
    return { type: 'real_estate', label: 'Real Estate & Properties' }
  }
  if (/chartered\s*accountant|ca\s*firm|tax\s*consultant|accounting|auditor|gst\s*consultant|income\s*tax|financ/i.test(text)) {
    return { type: 'ca_finance', label: 'CA & Tax Advisory' }
  }
  if (/clinic|doctor|dentist|dental|hospital|pathology|diagnostic|physician|pediatric|ortho|dermatolog|health/i.test(text)) {
    return { type: 'clinic_doctor', label: 'Clinic & Healthcare' }
  }
  if (/coaching|tuition|institute|academy|classes|education|training\s*center|school|tutor/i.test(text)) {
    return { type: 'coaching_education', label: 'Coaching & Education' }
  }
  if (/cafe|coffee|restaurant|bakery|bistro|dine|pizza|burger|lounge|fast\s*food/i.test(text)) {
    return { type: 'restaurant_cafe', label: 'Restaurant & Cafe' }
  }
  if (/hotel|resort|homestay|guest\s*house|residency|lodge|motel/i.test(text)) {
    return { type: 'hospitality_hotel', label: 'Hotel & Resort' }
  }
  if (/gym|fitness|crossfit|workout|yoga|trainer|pilates/i.test(text)) {
    return { type: 'gym_fitness', label: 'Gym & Fitness' }
  }
  if (/interior|architect|decor|modular\s*kitchen|designer/i.test(text)) {
    return { type: 'interior_architecture', label: 'Interior & Architecture' }
  }
  if (/salon|spa|parlour|beauty|hair|makeup|bridal|grooming/i.test(text)) {
    return { type: 'salon_beauty', label: 'Salon & Wellness' }
  }

  return { type: 'generic', label: 'Local Business' }
}

export function getStrategicWhyPitch(ctx: PitchContext): NicheStrategy {
  const rawBiz = ctx.businessName || ''
  const isDirectContact = rawBiz.toLowerCase().startsWith('direct contact')
  const cleanBiz = isDirectContact ? '' : rawBiz
  const recipientName = ctx.ownerName?.trim() || cleanBiz
  const greeting = recipientName ? `Hey ${recipientName}!` : 'Hey there!'

  // Extract pure city from address
  const rawAddress = ctx.address || ''
  const addressParts = rawAddress.split(',').map(s => s.trim()).filter(Boolean)
  const city = addressParts.length > 1
    ? addressParts[addressParts.length - 2].replace(/\d+/g, '').trim()
    : (addressParts[0] || 'your area')

  const { type: nicheType, label: nicheLabel } = detectNicheType(ctx.niche, ctx.businessName)

  const rawUrl = ctx.websiteUrl || ''
  const hasRealWebsite = Boolean(
    rawUrl &&
    rawUrl.toLowerCase() !== 'null' &&
    rawUrl.toLowerCase() !== 'undefined'
  )
  const isSocial = hasRealWebsite && /instagram\.com|facebook\.com|fb\.com|linkedin\.com/i.test(rawUrl)
  const isBroken = ctx.siteState === 'broken'

  // Sender intro
  const senderIntro = (ctx.includeSenderName !== false && ctx.senderName && ctx.senderName.trim())
    ? `${ctx.senderName.trim()} here from SynchAD Tech. `
    : ''

  // 1. BROKEN WEBSITE
  if (isBroken) {
    return {
      nicheType,
      nicheLabel,
      situation: 'BROKEN OR UNREACHABLE WEBSITE',
      angle: 'Urgent Brand Damage & Lost Enquiries',
      badgeColor: 'bg-rose-100 dark:bg-rose-950/70 border-2 border-rose-300 dark:border-rose-600',
      tagBg: 'bg-rose-500 text-white font-black shadow-xs',
      textColor: 'text-rose-950 dark:text-rose-100',
      whyPitch: `Their registered website link (${rawUrl}) is failing to load or throwing an error. Prospective clients searching in ${city} click their Google Maps link and land on an error screen, destroying trust and sending leads straight to competitors.`,
      recommendedSolution: `Emergency Website Revamp & Quick Client Lead Integration. Urgent fix pitch to stop leaking paying customers right now.`,
      defaultHook: `${greeting} ${senderIntro}Wanted to give you a quick heads up — noticed your website link on Google Maps (${rawUrl}) is currently not loading / showing an error page. Local clients and buyers in ${city} clicking your profile are bouncing off. We help businesses fix, revamp, and launch fast mobile-optimized portals. Would you be open for a quick 5-minute call or Zoom meeting to discuss fixing this?`
    }
  }

  // 2. SOCIAL MEDIA LINK ONLY
  if (isSocial) {
    return {
      nicheType,
      nicheLabel,
      situation: 'SOCIAL MEDIA LINK ONLY',
      angle: 'Social Page Lacks Authority & Direct Client Inquiries',
      badgeColor: 'bg-indigo-100 dark:bg-indigo-950/70 border-2 border-indigo-300 dark:border-indigo-600',
      tagBg: 'bg-indigo-600 text-white font-black shadow-xs',
      textColor: 'text-indigo-950 dark:text-indigo-100',
      whyPitch: `Their Google Maps profile links to a social page (${rawUrl}) instead of an official business platform. Social pages distract visitors with competitor suggestions and lack dedicated service catalogs or inquiry funnels.`,
      recommendedSolution: `Pitch a dedicated business website with service showcases, verified reviews, and direct WhatsApp enquiry funnels.`,
      defaultHook: `${greeting} ${senderIntro}Impressed by your Google Maps presence and reviews in ${city}! Noticed your profile links to a social media page (${rawUrl}) rather than an official business portal. Social links often limit your Google ranking and distract clients. We build dedicated high-converting websites and client portals for businesses in your space. If you'd like, I can share a few relevant work samples. Would you be open for a quick 5-minute call or Zoom this week?`
    }
  }

  // 3. ACTIVE WEBSITE EXISTS
  if (hasRealWebsite && ctx.siteState !== 'none') {
    switch (nicheType) {
      case 'real_estate':
        return {
          nicheType,
          nicheLabel,
          situation: 'ACTIVE SITE — LACKS DIGITAL PROPERTY SHOWCASE',
          angle: 'Mobile Traffic Drop-off & Slow Inquiry Friction',
          badgeColor: 'bg-emerald-100 dark:bg-emerald-950/70 border-2 border-emerald-300 dark:border-emerald-600',
          tagBg: 'bg-emerald-600 text-white font-black shadow-xs',
          textColor: 'text-emerald-950 dark:text-emerald-100',
          whyPitch: `They have an active website, but it lacks an interactive mobile property catalog and fast WhatsApp brochure download flow. Over 70% of property buyers browse on mobile and bounce if they cannot view floor plans and message instantly.`,
          recommendedSolution: `Upgrade with an interactive property showcase, downloadable brochures, and direct WhatsApp buyer inquiry funnel.`,
          defaultHook: `${greeting} ${senderIntro}Checked out ${rawUrl} — great presence in ${city}! Noticed your site could generate significantly more buyer leads with an interactive property catalog and fast WhatsApp brochure downloads for mobile visitors. We help real estate firms upgrade their digital portals into direct lead generation engines. Would you be open to checking a few samples on a quick 5-minute call or Zoom?`
        }

      case 'ca_finance':
        return {
          nicheType,
          nicheLabel,
          situation: 'ACTIVE SITE — OUTDATED CORPORATE PRESENCE',
          angle: 'Corporate Client Trust & Service Portfolio',
          badgeColor: 'bg-emerald-100 dark:bg-emerald-950/70 border-2 border-emerald-300 dark:border-emerald-600',
          tagBg: 'bg-emerald-600 text-white font-black shadow-xs',
          textColor: 'text-emerald-950 dark:text-emerald-100',
          whyPitch: `Their existing website is static and lacks modern advisory portfolios, partner credentials, and instant consultation scheduling for corporate clients in ${city}.`,
          recommendedSolution: `Modernize with an authoritative corporate advisory layout, downloadable tax checklists, and seamless consultation booking.`,
          defaultHook: `${greeting} ${senderIntro}Checked out ${rawUrl} — respected accounting practice in ${city}! Noticed your website could benefit from a modern corporate revamp with direct tax consultation booking and service portfolios for business clients. We build authoritative platforms for CA and advisory firms. Would you be open for a quick 5-minute call to check our work?`
        }

      case 'clinic_doctor':
        return {
          nicheType,
          nicheLabel,
          situation: 'ACTIVE SITE — NO ONLINE APPOINTMENT FLOW',
          angle: 'Patient Booking Drop-off on Mobile',
          badgeColor: 'bg-emerald-100 dark:bg-emerald-950/70 border-2 border-emerald-300 dark:border-emerald-600',
          tagBg: 'bg-emerald-600 text-white font-black shadow-xs',
          textColor: 'text-emerald-950 dark:text-emerald-100',
          whyPitch: `Their website lacks direct online appointment scheduling and mobile patient inquiry flows. Busy patients bounce rather than waiting on a phone line.`,
          recommendedSolution: `Integrate a seamless online appointment booking system and clean patient consultation funnels.`,
          defaultHook: `${greeting} ${senderIntro}Checked out ${rawUrl} — great healthcare presence in ${city}! Noticed your site lacks mobile-friendly direct appointment scheduling for patients. Many mobile patients bounce if booking isn't effortless. We help clinics optimize patient inquiries and automated appointment bookings. Open for a quick 5-minute chat?`
        }

      case 'restaurant_cafe':
        return {
          nicheType,
          nicheLabel,
          situation: 'ACTIVE SITE — LACKS DIGITAL MENU & DIRECT ORDERS',
          angle: 'Heavy Swiggy/Zomato Commissions & Lost Table Bookings',
          badgeColor: 'bg-emerald-100 dark:bg-emerald-950/70 border-2 border-emerald-300 dark:border-emerald-600',
          tagBg: 'bg-emerald-600 text-white font-black shadow-xs',
          textColor: 'text-emerald-950 dark:text-emerald-100',
          whyPitch: `Their website lacks a high-res mobile visual menu, table reservation flow, and commission-free direct takeaway ordering.`,
          recommendedSolution: `Revamp with a mobile QR/web menu, instant table reservations, and direct delivery inquiry funnels.`,
          defaultHook: `${greeting} ${senderIntro}Checked out ${rawUrl} — love the food and reviews for ${cleanBiz || 'your place'} in ${city}! Noticed the site could attract way more diners with a mobile visual menu and direct table reservation flow. We build fast restaurant websites that drive direct orders without heavy platform commissions. Open for a quick 5-minute call or Zoom this week?`
        }

      default:
        return {
          nicheType,
          nicheLabel,
          situation: 'ACTIVE SITE — MOBILE CONVERSION FRICTION',
          angle: 'Mobile Traffic Drop-off & Slow Inquiry Forms',
          badgeColor: 'bg-emerald-100 dark:bg-emerald-950/70 border-2 border-emerald-300 dark:border-emerald-600',
          tagBg: 'bg-emerald-600 text-white font-black shadow-xs',
          textColor: 'text-emerald-950 dark:text-emerald-100',
          whyPitch: `They have an active website, but it lacks direct WhatsApp chat and inquiry integration. Over 70% of local smartphone visitors refuse to fill out slow static contact forms and bounce without converting.`,
          recommendedSolution: `Modernize with fast WhatsApp inquiry integration and mobile speed optimization to boost lead conversion.`,
          defaultHook: `${greeting} ${senderIntro}Checked out ${rawUrl} — great business presence in ${city}! Noticed the site still relies on static inquiry forms which many smartphone visitors skip. We help businesses upgrade their websites with direct WhatsApp lead integration and modern design. If you'd like, I can share a few relevant samples. Would you be open for a quick 5-minute call or Zoom this week?`
        }
    }
  }

  // 4. NO WEBSITE DETECTED (NICHE-SPECIFIC HOOKS)
  switch (nicheType) {
    case 'real_estate':
      return {
        nicheType,
        nicheLabel,
        situation: 'NO PROPERTY SHOWCASE WEBSITE',
        angle: 'Direct Buyer Loss to Competitors with Online Catalogs',
        badgeColor: 'bg-amber-100 dark:bg-amber-950/70 border-2 border-amber-300 dark:border-amber-600',
        tagBg: 'bg-amber-500 text-white font-black shadow-xs',
        textColor: 'text-amber-950 dark:text-amber-100',
        whyPitch: `This business has an active Google Maps profile, but NO dedicated digital property portal. When prospective buyers and investors search for verified properties and dealers in ${city}, they click competitors who showcase active listings, floor plans, and instant WhatsApp brochures.`,
        recommendedSolution: `Pitch a modern high-converting Real Estate Portal with property showcase catalog, virtual project tours, and direct buyer WhatsApp inquiry funnel.`,
        defaultHook: `${greeting} ${senderIntro}Impressed by your reputation as a property consultant in ${city}! Noticed you don't have an official property showcase website linked yet. Serious buyers looking for flats, plots, and commercial spaces online often turn to competitors who showcase verified listings and project brochures. We build high-converting real estate portals that generate verified buyer leads directly on WhatsApp. Would you be open to checking out a few of our real estate samples on a quick 5-minute call or Zoom this week?`
      }

    case 'ca_finance':
      return {
        nicheType,
        nicheLabel,
        situation: 'NO OFFICIAL CA & TAX ADVISORY PORTAL',
        angle: 'Corporate Client Trust & Brand Authority Deficit',
        badgeColor: 'bg-amber-100 dark:bg-amber-950/70 border-2 border-amber-300 dark:border-amber-600',
        tagBg: 'bg-amber-500 text-white font-black shadow-xs',
        textColor: 'text-amber-950 dark:text-amber-100',
        whyPitch: `High-net-worth business owners and corporations in ${city} look for credibility, partner profiles, and service scopes (GST, ITR, Audit, ROC) before choosing a tax firm. Without an official website, they perceive the practice as unverified and move to larger firms.`,
        recommendedSolution: `Pitch an authoritative Corporate CA & Tax Advisory Portal with client trust testimonials, compliance service portfolio, and direct consultation booking.`,
        defaultHook: `${greeting} ${senderIntro}Great to see your established accounting & tax practice in ${city} with strong client reviews! Noticed your firm doesn't have an official website linked yet. Business owners and startups seeking corporate tax, GST, and audit guidance always check credibility and service portfolios online before consulting. We build authoritative CA advisory platforms that build instant trust. Would you be open for a quick 5-minute call to check out our finance & corporate website samples?`
      }

    case 'clinic_doctor':
      return {
        nicheType,
        nicheLabel,
        situation: 'NO CLINIC WEBSITE OR APPOINTMENT PORTAL',
        angle: 'Patients Booking Competitors with Online Systems',
        badgeColor: 'bg-amber-100 dark:bg-amber-950/70 border-2 border-amber-300 dark:border-amber-600',
        tagBg: 'bg-amber-500 text-white font-black shadow-xs',
        textColor: 'text-amber-950 dark:text-amber-100',
        whyPitch: `Patients searching for trusted healthcare specialists in ${city} want to verify doctor qualifications, clinic timings, treatments offered, and book appointments without the hassle of a busy phone line. Without an official portal, patients choose hospitals and clinics with online appointment systems.`,
        recommendedSolution: `Pitch a clean, patient-friendly Clinic & Diagnostics Portal with doctor profiles, treatment guides, and seamless appointment booking.`,
        defaultHook: `${greeting} ${senderIntro}Noticed your excellent patient reputation and reviews for healthcare in ${city}! When families search for trusted specialists on Google, they look for treatment details, doctor timings, and easy online appointment booking. We build clean, patient-friendly medical & clinic websites that automate patient consultations. Would you be open for a quick 5-minute call or Zoom this week to see some healthcare samples?`
      }

    case 'coaching_education':
      return {
        nicheType,
        nicheLabel,
        situation: 'NO OFFICIAL INSTITUTE PORTAL',
        angle: 'Students Enrolling in Competitors with Online Demo Bookings',
        badgeColor: 'bg-amber-100 dark:bg-amber-950/70 border-2 border-amber-300 dark:border-amber-600',
        tagBg: 'bg-amber-500 text-white font-black shadow-xs',
        textColor: 'text-amber-950 dark:text-amber-100',
        whyPitch: `Students and parents researching coaching institutes in ${city} compare past batch results, faculty credentials, syllabus details, and want to book a free demo class. Without a modern institute portal, prospective students enroll with competing coaching centers.`,
        recommendedSolution: `Pitch a student enrollment portal with topper showcase, batch schedules, course syllabus downloads, and demo class registrations.`,
        defaultHook: `${greeting} ${senderIntro}Loved seeing the strong student ratings and reputation for ${cleanBiz || 'your institute'} in ${city}! When parents and students search online, they compare topper results, batch timings, and demo class options. Without an official institute portal, many students end up enrolling with competing institutes. We build modern coaching websites that drive student admissions and demo inquiries directly to WhatsApp. Open for a quick 5-minute chat or Zoom this week?`
      }

    case 'restaurant_cafe':
      return {
        nicheType,
        nicheLabel,
        situation: 'NO OFFICIAL RESTAURANT OR CAFE WEBSITE',
        angle: 'Lost Direct Diners & Paying 25% Delivery Commissions',
        badgeColor: 'bg-amber-100 dark:bg-amber-950/70 border-2 border-amber-300 dark:border-amber-600',
        tagBg: 'bg-amber-500 text-white font-black shadow-xs',
        textColor: 'text-amber-950 dark:text-amber-100',
        whyPitch: `Local diners and food lovers in ${city} check Google Maps to view the food menu, pricing, ambiance photos, and table availability. Without an official website, they either bounce or order on Swiggy/Zomato where the restaurant loses 20-30% in platform commissions.`,
        recommendedSolution: `Pitch a mobile-first Cafe/Restaurant Website with mouthwatering digital menu, photo gallery, table reservations, and commission-free direct takeaway ordering.`,
        defaultHook: `${greeting} ${senderIntro}Huge fan of ${cleanBiz || 'your business'} in ${city} — love your ambiance and food reviews! When local food lovers search on Google Maps, they want to browse a digital menu with photos and book tables directly. We build vibrant, mobile-first restaurant websites that attract diners and drive direct orders without paying heavy delivery platform commissions. Open for a quick 5-minute call or Zoom to check out our food & beverage samples?`
      }

    case 'hospitality_hotel':
      return {
        nicheType,
        nicheLabel,
        situation: 'NO DIRECT HOTEL BOOKING WEBSITE',
        angle: 'Losing 15-22% Commissions to MakeMyTrip/Goibibo',
        badgeColor: 'bg-amber-100 dark:bg-amber-950/70 border-2 border-amber-300 dark:border-amber-600',
        tagBg: 'bg-amber-500 text-white font-black shadow-xs',
        textColor: 'text-amber-950 dark:text-amber-100',
        whyPitch: `Guests searching for accommodations in ${city} want to see room photos, amenities, tariffs, and book directly. Without an official booking site, they book on MakeMyTrip or Goibibo, costing the property 15-22% in OTA commissions on every single reservation.`,
        recommendedSolution: `Pitch a luxury hospitality website with room photo galleries, virtual amenity showcase, event/banquet inquiries, and direct commission-free booking.`,
        defaultHook: `${greeting} ${senderIntro}Great to see your hospitality presence and guest reviews in ${city}! Most travelers prefer booking directly on an official website if they can see room photos and tariffs, which also saves you 15-20% OTA commissions on platforms like MakeMyTrip. We build premium hotel and resort websites with direct guest reservation funnels. Can I share a few hospitality samples on a quick 5-minute call?`
      }

    case 'gym_fitness':
      return {
        nicheType,
        nicheLabel,
        situation: 'NO FITNESS CLUB PORTAL OR TRIAL PASS FLOW',
        angle: 'Prospects Joining Competitors Offering Online Trial Passes',
        badgeColor: 'bg-amber-100 dark:bg-amber-950/70 border-2 border-amber-300 dark:border-amber-600',
        tagBg: 'bg-amber-500 text-white font-black shadow-xs',
        textColor: 'text-amber-950 dark:text-amber-100',
        whyPitch: `Fitness enthusiasts in ${city} search Google Maps to check gym equipment, workout plans, trainer profiles, and claim trial passes. Without an official portal, they visit other fitness clubs that offer online pass booking.`,
        recommendedSolution: `Pitch a fitness brand portal with membership tiers, transformation showcases, trainer profiles, and 1-day free trial pass registration.`,
        defaultHook: `${greeting} ${senderIntro}Awesome to see the fitness buzz and solid reviews for ${cleanBiz || 'your gym'} in ${city}! When gym-goers search nearby, they want to check out gym equipment, membership plans, and claim a trial pass. We build high-energy fitness websites that turn local searchers into active gym members. Would you be open for a quick 5-minute call or Zoom to check our work?`
      }

    case 'interior_architecture':
      return {
        nicheType,
        nicheLabel,
        situation: 'NO DIGITAL DESIGN PORTFOLIO',
        angle: 'High-Budget Clients Demanding Verified Project Portfolios',
        badgeColor: 'bg-amber-100 dark:bg-amber-950/70 border-2 border-amber-300 dark:border-amber-600',
        tagBg: 'bg-amber-500 text-white font-black shadow-xs',
        textColor: 'text-amber-950 dark:text-amber-100',
        whyPitch: `Home and office owners in ${city} planning interior projects look for extensive portfolio galleries, 3D renders, and recent client project photos before reaching out. Without a website, they can't gauge design capability and hire competitors with sleek online portfolios.`,
        recommendedSolution: `Pitch an architectural & interior design portfolio website showcasing 3D design galleries, packages, and direct consultation booking.`,
        defaultHook: `${greeting} ${senderIntro}Impressed by your creative presence and design reviews in ${city}! For high-ticket interior and architecture projects, clients always look for past project galleries, 3D renders, and case studies before hiring. We build sleek design portfolio websites that showcase your work and attract premium clients. Would you be open for a quick 5-minute call to see our design portfolios?`
      }

    case 'salon_beauty':
      return {
        nicheType,
        nicheLabel,
        situation: 'NO SALON WEBSITE OR SERVICE RATE CARD',
        angle: 'Clients Booking Salons with Online Service Catalogs',
        badgeColor: 'bg-amber-100 dark:bg-amber-950/70 border-2 border-amber-300 dark:border-amber-600',
        tagBg: 'bg-amber-500 text-white font-black shadow-xs',
        textColor: 'text-amber-950 dark:text-amber-100',
        whyPitch: `Clients looking for beauty and salon services in ${city} want to see rate cards, bridal packages, hair/skin services, and easily book an appointment slot. Without a digital catalog, they choose salons with clear online packages.`,
        recommendedSolution: `Pitch a premium salon & beauty website with digital rate card, service packages, and direct appointment bookings.`,
        defaultHook: `${greeting} ${senderIntro}Loved seeing your fantastic salon ratings and customer feedback in ${city}! Clients looking for grooming and beauty services always check service packages, price lists, and bridal portfolios online before visiting. We build elegant salon websites that drive appointments and bridal inquiries directly to WhatsApp. Open for a quick 5-minute call this week?`
      }

    default:
      return {
        nicheType: 'generic',
        nicheLabel: 'Local Business',
        situation: 'NO OFFICIAL BUSINESS WEBSITE',
        angle: 'Direct Customer Leak to Online Competitors',
        badgeColor: 'bg-amber-100 dark:bg-amber-950/70 border-2 border-amber-300 dark:border-amber-600',
        tagBg: 'bg-amber-500 text-white font-black shadow-xs',
        textColor: 'text-amber-950 dark:text-amber-100',
        whyPitch: `This business has an active Google Maps profile with customer reviews, but ZERO official website. When local customers in ${city} search online, they click competitors who have an official website and direct digital inquiry flow.`,
        recommendedSolution: `Pitch a modern, high-converting business website with mobile optimization, customer review showcases, and direct WhatsApp inquiry flow.`,
        defaultHook: `${greeting} ${senderIntro}Impressed by your Google Maps presence and strong customer reviews in ${city}! Noticed you don't have an official business website linked yet, so many local clients end up choosing competitors with an active digital presence. We build modern, high-converting websites and custom management portals for businesses like yours. If you'd like, I can share a few relevant work samples. Would you be open for a quick 5-minute call or Zoom meeting this week?`
      }
  }
}
