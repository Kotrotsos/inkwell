import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existing = await prisma.document.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Generate a new shareId if not already shared
    const shareId = existing.shareId || nanoid(10)

    const document = await prisma.document.update({
      where: { id },
      data: { shareId },
    })

    return NextResponse.json({ shareId: document.shareId })
  } catch (error) {
    console.error('Share document error:', error)
    return NextResponse.json(
      { error: 'Failed to share document' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existing = await prisma.document.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    await prisma.document.update({
      where: { id },
      data: { shareId: null },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unshare document error:', error)
    return NextResponse.json(
      { error: 'Failed to unshare document' },
      { status: 500 }
    )
  }
}
