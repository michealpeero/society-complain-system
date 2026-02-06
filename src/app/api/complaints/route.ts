import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Complaint } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, category, photos, memberId, societyId, submitter, preferredStaffId } = body;

    console.log('=== Complaint Creation Attempt ===');
    console.log('Received data:', {
      title: !!title,
      description: !!description,
      category: !!category,
      photos: photos?.length || 0,
      memberId,
      societyId: !!societyId,
      submitter: !!submitter,
      preferredStaffId
    });

    // Validate required fields
    if (!title || !description || !category || !societyId || !submitter) {
      console.log('Validation failed:', {
        hasTitle: !!title,
        hasDescription: !!description,
        hasCategory: !!category,
        hasSocietyId: !!societyId,
        hasSubmitter: !!submitter
      });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Creating complaint in database...');
    
    // Create complaint
    const complaint = await db.complaint.create({
      data: {
        title,
        description,
        category,
        photos: photos ? (typeof photos === 'string' ? photos : JSON.stringify(photos)) : null,
        memberId,
        societyId,
        submitter,
        preferredStaffId: preferredStaffId || null,
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      },
    });

    console.log('Complaint created successfully:', complaint.id);

    return NextResponse.json({
      success: true,
      complaint: {
        ...complaint,
        photos: complaint.photos ? JSON.parse(complaint.photos) : [],
      },
    });
  } catch (error) {
    console.error('=== Complaint Creation Error ===');
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to create complaint' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const memberId = searchParams.get('memberId');
    const societyId = searchParams.get('societyId');
    const category = searchParams.get('category');

    if (!societyId) {
      return NextResponse.json(
        { error: 'societyId is required' },
        { status: 400 }
      );
    }

    // Build where clause
    const where: any = { societyId };
    if (memberId) {
      where.memberId = memberId;
    }
    if (category) {
      where.category = category;
    }

    // Get complaints
    const complaints = await db.complaint.findMany({
      where,
      include: {
        member: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Parse photos for each complaint
    const complaintsWithParsedPhotos = complaints.map((complaint) => ({
      ...complaint,
      photos: complaint.photos ? JSON.parse(complaint.photos) : [],
      staffPhotos: complaint.staffPhotos ? JSON.parse(complaint.staffPhotos) : [],
    }));

    return NextResponse.json({
      success: true,
      complaints: complaintsWithParsedPhotos,
    });
  } catch (error) {
    console.error('Error fetching complaints:', error);
    return NextResponse.json(
      { error: 'Failed to fetch complaints' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { complaintId, status, staffId, staffName, staffPhotos } = body;

    console.log('=== Complaint Status Update (PUT) ===');
    console.log('Complaint ID:', complaintId);
    console.log('New Status:', status);
    console.log('Staff ID:', staffId);
    console.log('Staff Name:', staffName);

    if (!complaintId || !status) {
      return NextResponse.json(
        { error: 'complaintId and status are required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['pending', 'in-progress', 'resolved', 'rejected', 'closed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: pending, in-progress, resolved, rejected, closed' },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: any = { status };

    // If status is being changed to in-progress, assign to staff
    if (status === 'in-progress' && staffId) {
      updateData.assignedStaffId = staffId;
      updateData.assignedStaffName = staffName;
      updateData.assignedAt = new Date();
    }

    // If status is being changed back to pending, rejected, or closed, unassign
    if (status === 'pending' || status === 'rejected' || status === 'closed') {
      updateData.assignedStaffId = null;
      updateData.assignedStaffName = null;
      updateData.assignedAt = null;
    }

    // Handle staff photos upload
    if (staffPhotos) {
      updateData.staffPhotos = typeof staffPhotos === 'string' ? staffPhotos : JSON.stringify(staffPhotos);
    }

    // Update complaint
    const complaint = await db.complaint.update({
      where: { id: complaintId },
      data: updateData,
      include: {
        member: true,
      },
    });

    console.log('Complaint status updated successfully:', complaint.id);

    return NextResponse.json({
      success: true,
      complaint: {
        ...complaint,
        photos: complaint.photos ? JSON.parse(complaint.photos) : [],
        staffPhotos: complaint.staffPhotos ? JSON.parse(complaint.staffPhotos) : [],
      },
    });
  } catch (error) {
    console.error('=== Complaint Status Update Error ===');
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to update complaint status' },
      { status: 500 }
    );
  }
}
