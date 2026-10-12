import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const PROFILE_FILE_PATH = path.join(process.cwd(), 'data', 'whatsapp_profile.json')
const ENV_FILE_PATH = path.join(process.cwd(), '.env.local')

/** Update a key in .env.local file, preserving all other lines */
function updateEnvFile(key: string, value: string) {
  try {
    let content = ''
    if (fs.existsSync(ENV_FILE_PATH)) {
      content = fs.readFileSync(ENV_FILE_PATH, 'utf-8')
    }
    const lines = content.split('\n')
    const keyPrefix = `${key}=`
    const idx = lines.findIndex((l) => l.startsWith(keyPrefix))
    if (idx !== -1) {
      lines[idx] = `${key}=${value}`
    } else {
      lines.push(`${key}=${value}`)
    }
    fs.writeFileSync(ENV_FILE_PATH, lines.join('\n'), 'utf-8')
    console.log(`[.env.local] Updated ${key}`)
  } catch (err) {
    console.error('[.env.local Update Error]:', err)
  }
}

export const META_CATEGORIES = [
  { value: 'PROF_SERVICES', label: 'Professional Services (Recommended for B2B & Agencies)' },
  { value: 'OTHER', label: 'Other' },
  { value: 'AUTO', label: 'Automotive' },
  { value: 'BEAUTY', label: 'Beauty, Spa & Salon' },
  { value: 'APPAREL', label: 'Clothing & Apparel' },
  { value: 'EDU', label: 'Education' },
  { value: 'ENTERTAIN', label: 'Entertainment' },
  { value: 'EVENT_PLAN', label: 'Event Planning & Service' },
  { value: 'FINANCE', label: 'Finance & Banking' },
  { value: 'GROCERY', label: 'Grocery Store' },
  { value: 'GOVT', label: 'Government & Public Service' },
  { value: 'HOTEL', label: 'Hotel & Lodging' },
  { value: 'HEALTH', label: 'Medical & Health' },
  { value: 'NONPROFIT', label: 'Non-profit' },
  { value: 'RETAIL', label: 'Shopping & Retail' },
  { value: 'TRAVEL', label: 'Travel & Transportation' },
  { value: 'RESTAURANT', label: 'Restaurant' },
]

function readLocalProfile() {
  try {
    if (fs.existsSync(PROFILE_FILE_PATH)) {
      const data = fs.readFileSync(PROFILE_FILE_PATH, 'utf-8')
      return JSON.parse(data)
    }
  } catch (err) {
    console.error('Error reading local profile:', err)
  }

  return {
    display_name: 'Synchad',
    phone_number: '+91 70675 49982',
    phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID || '1268131546394409',
    waba_id: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '1114054964346569',
    vertical: 'PROF_SERVICES',
    about: 'Autonomous B2B Growth Engine • WhatsApp CRM',
    description: 'Synchad delivers autonomous B2B lead generation, website conversion audits, and 1-tap WhatsApp booking pipelines for modern businesses.',
    email: 'contact@synchad.online',
    address: 'India',
    websites: ['https://synchad.online/'],
    profile_picture_url: '',
    quality_rating: 'HIGH',
    verified: true,
  }
}

function writeLocalProfile(data: any) {
  try {
    const dir = path.dirname(PROFILE_FILE_PATH)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(PROFILE_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8')
  } catch (err) {
    console.error('Error writing local profile:', err)
  }
}

export async function GET() {
  const profile = readLocalProfile()
  const token = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || profile.phone_number_id || '1268131546394409'

  let metaLive: any = null
  let metaStatus = {
    connected: false,
    token_configured: Boolean(token),
    status: token ? 'checking' : 'not_configured',
    message: token ? 'Verifying with Meta...' : 'No Meta WhatsApp token provided in .env.local',
  }

  if (token && phoneId) {
    try {
      const metaRes = await fetch(
        `https://graph.facebook.com/v21.0/${phoneId}/whatsapp_business_profile?fields=about,address,description,email,profile_picture_url,websites,vertical`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        }
      )

      const metaData = await metaRes.json()

      if (metaRes.ok && metaData.data && metaData.data.length > 0) {
        metaLive = metaData.data[0]
        metaStatus = {
          connected: true,
          token_configured: true,
          status: 'live',
          message: 'Connected to official Meta WhatsApp Cloud API.',
        }

        // Merge live data with local profile
        if (metaLive.about) profile.about = metaLive.about
        if (metaLive.address) profile.address = metaLive.address
        if (metaLive.description) profile.description = metaLive.description
        if (metaLive.email) profile.email = metaLive.email
        if (metaLive.vertical) profile.vertical = metaLive.vertical
        if (metaLive.websites) profile.websites = metaLive.websites
        if (metaLive.profile_picture_url) profile.profile_picture_url = metaLive.profile_picture_url

        // Also query verified phone details directly from Meta
        try {
          const phoneRes = await fetch(
            `https://graph.facebook.com/v21.0/${phoneId}?fields=display_phone_number,verified_name,quality_rating`,
            {
              headers: { Authorization: `Bearer ${token}` },
              cache: 'no-store',
            }
          )
          const phoneData = await phoneRes.json()
          if (phoneRes.ok && phoneData) {
            if (phoneData.verified_name) profile.display_name = phoneData.verified_name
            if (phoneData.display_phone_number) profile.phone_number = phoneData.display_phone_number
            if (phoneData.quality_rating) profile.quality_rating = phoneData.quality_rating
          }
        } catch (phoneErr) {
          console.error('[Meta Phone Query Error]:', phoneErr)
        }

        writeLocalProfile(profile)
      } else {
        const errMsg = metaData.error?.message || 'Meta API returned an error'
        const isBlocked = errMsg.toLowerCase().includes('blocked') || metaData.error?.code === 200
        const isExpired = errMsg.toLowerCase().includes('expired') || metaData.error?.code === 190
        metaStatus = {
          connected: false,
          token_configured: true,
          status: isBlocked ? 'api_blocked' : isExpired ? 'token_expired' : 'error',
          message: isBlocked
            ? 'Meta API Access Blocked (Code 200) — Meta requires a security checkpoint or policy confirmation on your account. Open developers.facebook.com or business.facebook.com to resolve.'
            : isExpired
            ? 'Meta Access Token has expired (24h temporary token). Generate a fresh token in Meta Developer Portal or set a Permanent System User Token.'
            : errMsg,
        }
      }
    } catch (err: any) {
      metaStatus = {
        connected: false,
        token_configured: true,
        status: 'network_error',
        message: err.message || 'Failed to connect to Meta Graph API.',
      }
    }
  }

  return NextResponse.json({
    profile,
    metaStatus,
    categories: META_CATEGORIES,
    phoneId,
    wabaId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || profile.waba_id,
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const current = readLocalProfile()

    const updated = {
      ...current,
      ...body,
      updated_at: new Date().toISOString(),
    }

    // Save locally immediately
    writeLocalProfile(updated)

    // --- Handle new Access Token: verify + persist to .env.local ---
    const newToken = body.accessToken?.trim()
    const envToken = process.env.WHATSAPP_ACCESS_TOKEN
    const token = newToken || envToken
    const phoneId = body.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || updated.phone_number_id

    let tokenVerified = false
    let metaResult: any = null
    let metaUpdated = false
    let metaError: string | null = null

    // If a new token was passed, first verify it works
    if (newToken && phoneId) {
      try {
        const verifyRes = await fetch(
          `https://graph.facebook.com/v21.0/${phoneId}?fields=id,display_phone_number,verified_name`,
          { headers: { Authorization: `Bearer ${newToken}` }, cache: 'no-store' }
        )
        const verifyData = await verifyRes.json()
        if (verifyRes.ok && verifyData.id) {
          tokenVerified = true
          // Persist to .env.local so it survives server restarts
          updateEnvFile('WHATSAPP_ACCESS_TOKEN', newToken)
          console.log('[WhatsApp Token] New permanent token saved to .env.local')
        } else {
          const errMsg = verifyData.error?.message || 'Token verification failed'
          return NextResponse.json({
            success: false,
            error: `New token is invalid: ${errMsg}. Please generate a fresh token from Meta Developer Portal.`,
          }, { status: 400 })
        }
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          error: `Token verification request failed: ${err.message}`,
        }, { status: 500 })
      }
    }

    if (token && phoneId) {
      try {
        const payload: Record<string, any> = {
          messaging_product: 'whatsapp',
        }

        if (updated.about) payload.about = updated.about.slice(0, 139)
        if (updated.address) payload.address = updated.address.slice(0, 256)
        if (updated.description) payload.description = updated.description.slice(0, 512)
        if (updated.email) payload.email = updated.email.slice(0, 128)
        if (updated.vertical) payload.vertical = updated.vertical
        if (updated.websites && Array.isArray(updated.websites)) {
          payload.websites = updated.websites.filter(Boolean).slice(0, 2)
        }

        const metaRes = await fetch(
          `https://graph.facebook.com/v21.0/${phoneId}/whatsapp_business_profile`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          }
        )

        const resData = await metaRes.json()

        if (metaRes.ok && resData.success) {
          metaUpdated = true
          metaResult = resData
        } else {
          metaError = resData.error?.message || 'Meta API returned an error'
        }
      } catch (err: any) {
        metaError = err.message || 'Failed to reach Meta API endpoint'
      }
    }

    return NextResponse.json({
      success: true,
      profile: updated,
      metaUpdated,
      tokenVerified,
      metaError,
      message: tokenVerified
        ? metaUpdated
          ? '✅ New token verified & saved permanently! Profile synced to Meta WhatsApp!'
          : `✅ New token verified & saved to .env.local! ${metaError ? 'Profile sync: ' + metaError : 'Token will now be used for all WhatsApp sends.'}`
        : metaUpdated
        ? 'Profile updated successfully and synced to official Meta WhatsApp!'
        : metaError
        ? `Profile saved locally, but Meta sync reported: ${metaError}`
        : 'Profile saved successfully locally.',
    })
  } catch (error: any) {
    console.error('Error saving WhatsApp profile:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
