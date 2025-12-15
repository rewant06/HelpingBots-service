import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { veilApi } from '@/lib/veil-client'; // Ensure this works server-side or use fetch directly
import { PostCard } from '@/components/veil/PostCard';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

// --- 1. DYNAMIC METADATA GENERATION ---
// This runs on the server BEFORE the page loads. 
// Google Bot waits for this function to finish to read the title/description.
export async function generateMetadata({ params }: { params: { postId: string } }): Promise<Metadata> {
  try {
    // We fetch the post data directly using fetch to avoid client-side auth issues if any
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/${params.postId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store' // Ensure we get fresh data
    });

    if (!response.ok) return { title: 'Post Not Found' };
    
    const post = await response.json();
    
    // TRUNCATE DESCRIPTION
    const description = post.content.length > 160 
      ? post.content.substring(0, 157) + "..." 
      : post.content;

    return {
      title: `${post.authorDisplayName}'s Post | VEIL`,
      description: description,
      openGraph: {
        title: `Anonymous Post by ${post.authorDisplayName}`,
        description: description,
        type: 'article',
        // If you have dynamic OG images later, add them here
      },
    };
  } catch (e) {
    return { title: 'Error | VEIL' };
  }
}

// --- 2. THE PAGE UI ---
export default async function SinglePostPage({ params }: { params: { postId: string } }) {
  // Fetch data again for the UI (Next.js automatically dedupes this request with the one above)
  let post = null;
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/${params.postId}`, {
       cache: 'no-store'
    });
    if (response.ok) {
        post = await response.json();
    }
  } catch (e) {}

  if (!post) {
    return notFound(); // Shows the 404 page
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* BACK BUTTON */}
        <Link href="/veil">
          <Button variant="ghost" className="gap-2 pl-0 hover:pl-2 transition-all">
            <ArrowLeft className="w-4 h-4" /> Back to Feed
          </Button>
        </Link>

        {/* THE POST CARD */}
        {/* We use the same component but pass the data we fetched server-side */}
        <PostCard post={post} />
      </div>
    </div>
  );
}