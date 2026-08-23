import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response>) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find all pre-order books whose arrival_date was 7+ days ago
    // A book is "Pre-order" when arrival_date > now().
    // We want to flip books where arrival_date <= now() - 7 days (i.e., ETA passed a week ago).
    // We set arrival_date to yesterday so computeStatus() returns "On Hand" instead of "Pre-order".
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);
    const cutoffStr = cutoffDate.toISOString().split('T')[0]; // YYYY-MM-DD

    // Select pre-order books where arrival_date <= cutoff (ETA passed 7+ days ago)
    const { data: booksToSwitch, error: selectError } = await supabase
      .from('books')
      .select('id, title, batch, arrival_date')
      .not('arrival_date', 'is', null)
      .lte('arrival_date', cutoffStr);

    if (selectError) {
      console.error('Error fetching books:', selectError);
      return new Response(JSON.stringify({ error: selectError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!booksToSwitch || booksToSwitch.length === 0) {
      return new Response(JSON.stringify({ message: 'No books to switch', switched: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ids = booksToSwitch.map((b: { id: string }) => b.id);

    // Set arrival_date to null so computeStatus() evaluates inventory instead
    // (null arrival_date means no future ETA → status falls through to On Hand / Sold Out based on stock)
    const { error: updateError } = await supabase
      .from('books')
      .update({ arrival_date: null, updated_at: new Date().toISOString() })
      .in('id', ids);

    if (updateError) {
      console.error('Error updating books:', updateError);
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Auto-switched ${ids.length} book(s) to on-hand status:`, booksToSwitch.map((b: { title: string }) => b.title));

    return new Response(
      JSON.stringify({
        message: `Successfully switched ${ids.length} book(s) to on-hand`,
        switched: ids.length,
        books: booksToSwitch.map((b: { title: string; batch: string }) => ({ title: b.title, batch: b.batch })),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
