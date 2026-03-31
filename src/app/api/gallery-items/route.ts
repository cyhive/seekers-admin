import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db('party');
        const collection = db.collection('Gallery');

        const items = await collection.find({}).sort({ createdAt: -1 }).toArray();

        return NextResponse.json(items, { status: 200 });
    } catch (error) {
        console.error('Fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch gallery items' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;

        if (!title) {
            return NextResponse.json(
                { error: 'Title is required' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db('party');
        const collection = db.collection('Gallery');

        // Convert files to base64
        const images: string[] = [];
        const files = formData.getAll('images') as File[];

        for (const file of files) {
            const buffer = await file.arrayBuffer();
            const base64 = Buffer.from(buffer).toString('base64');
            const mimeType = file.type;
            images.push(`data:${mimeType};base64,${base64}`);
        }

        const item = {
            title,
            description: description || '',
            images,
            createdAt: new Date(),
        };

        const result = await collection.insertOne(item);

        return NextResponse.json(
            { ...item, _id: result.insertedId },
            { status: 201 }
        );
    } catch (error) {
        console.error('Create error:', error);
        return NextResponse.json(
            { error: 'Failed to create gallery item' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'ID is required' },
                { status: 400 }
            );
        }

        const formData = await request.formData();
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const removedImagesStr = formData.get('removedImages') as string;
        const existingImagesStr = formData.get('existingImages') as string;

        if (!title) {
            return NextResponse.json(
                { error: 'Title is required' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db('party');
        const collection = db.collection('Gallery');

        // Get existing item
        const existingItem = await collection.findOne({ _id: new ObjectId(id) });
        if (!existingItem) {
            return NextResponse.json(
                { error: 'Gallery item not found' },
                { status: 404 }
            );
        }

        // Process existing images
        const existingImages = existingImagesStr ? JSON.parse(existingImagesStr) : [];
        const removedImages = removedImagesStr ? JSON.parse(removedImagesStr) : [];
        const keepImages = existingImages.filter((img: string) => !removedImages.includes(img));

        // Convert new files to base64
        const newImages: string[] = [];
        const files = formData.getAll('images') as File[];

        for (const file of files) {
            if (file.size > 0) {
                const buffer = await file.arrayBuffer();
                const base64 = Buffer.from(buffer).toString('base64');
                const mimeType = file.type;
                newImages.push(`data:${mimeType};base64,${base64}`);
            }
        }

        const allImages = [...keepImages, ...newImages];

        const updatedItem = {
            title,
            description: description || '',
            images: allImages,
            updatedAt: new Date(),
        };

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updatedItem }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { error: 'Gallery item not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { _id: id, ...updatedItem },
            { status: 200 }
        );
    } catch (error) {
        console.error('Update error:', error);
        return NextResponse.json(
            { error: 'Failed to update gallery item' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const ids = searchParams.get('ids')?.split(',') || [];

        if (ids.length === 0) {
            return NextResponse.json(
                { error: 'No IDs provided' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db('party');
        const collection = db.collection('Gallery');

        const objectIds = ids.map(id => new ObjectId(id));
        const result = await collection.deleteMany({ _id: { $in: objectIds } });

        return NextResponse.json(
            { message: 'Gallery items deleted successfully', deletedCount: result.deletedCount },
            { status: 200 }
        );
    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json(
            { error: 'Failed to delete gallery items' },
            { status: 500 }
        );
    }
}
