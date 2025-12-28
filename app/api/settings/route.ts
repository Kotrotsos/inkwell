import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await prisma.settings.findUnique({
      where: { userId: session.user.id },
    })

    if (!settings) {
      return NextResponse.json({
        fontFamily: 'serif',
        fontSize: 'medium',
        lineHeight: 'normal',
        theme: 'system',
        contentWidth: 'default',
        backgroundColor: 'gray',
      })
    }

    return NextResponse.json({
      fontFamily: settings.fontFamily,
      fontSize: settings.fontSize,
      lineHeight: settings.lineHeight,
      theme: settings.theme,
      contentWidth: settings.contentWidth,
      backgroundColor: settings.backgroundColor,
    })
  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      fontFamily,
      fontSize,
      lineHeight,
      theme,
      contentWidth,
      backgroundColor,
    } = await request.json()

    const settings = await prisma.settings.upsert({
      where: { userId: session.user.id },
      update: {
        ...(fontFamily !== undefined && { fontFamily }),
        ...(fontSize !== undefined && { fontSize }),
        ...(lineHeight !== undefined && { lineHeight }),
        ...(theme !== undefined && { theme }),
        ...(contentWidth !== undefined && { contentWidth }),
        ...(backgroundColor !== undefined && { backgroundColor }),
      },
      create: {
        userId: session.user.id,
        fontFamily: fontFamily || 'serif',
        fontSize: fontSize || 'medium',
        lineHeight: lineHeight || 'normal',
        theme: theme || 'system',
        contentWidth: contentWidth || 'default',
        backgroundColor: backgroundColor || 'gray',
      },
    })

    return NextResponse.json({
      fontFamily: settings.fontFamily,
      fontSize: settings.fontSize,
      lineHeight: settings.lineHeight,
      theme: settings.theme,
      contentWidth: settings.contentWidth,
      backgroundColor: settings.backgroundColor,
    })
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
