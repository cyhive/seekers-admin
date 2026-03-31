import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db('party');
        const collection = db.collection('Gallery');

        const images = await collection.find({}).sort({ createdAt: -1 }).toArray();

        return NextResponse.json(images, { status: 200 });
    } catch (error) {
        console.error('Fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch images' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { imageId } = await request.json();

        if (!imageId) {
            return NextResponse.json(
                { error: 'Image ID is required' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db('party');
        const collection = db.collection('Gallery');

        const result = await collection.deleteOne({ _id: new ObjectId(imageId) });

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { error: 'Image not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: 'Image deleted successfully!' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json(
            { error: 'Failed to delete image' },
            { status: 500 }
        );
    }
}
