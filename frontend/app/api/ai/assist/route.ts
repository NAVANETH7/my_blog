import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { action, content, title, summary, prompt } = await req.json();
    
    // Construct prompt based on action
    let promptText = '';
    switch (action) {
      case 'improve_summary':
        promptText = `Improve this summary excerpt for a developer blog post to make it more engaging and SEO-friendly. Keep it strictly under 160 characters.\n\nCurrent Excerpt: "${summary || 'None'}"\nPost Title: "${title}"\nPost Content:\n${content || ''}`;
        break;
      case 'suggest_title':
        promptText = `Generate 3 alternative, highly clickable and SEO-friendly titles for this developer blog post.\n\nCurrent Title: "${title}"\nPost Summary: "${summary || 'None'}"\nPost Content:\n${content || ''}`;
        break;
      case 'generate_tags':
        promptText = `Suggest up to 5 relevant technical tags (comma-separated, lowercase) for this blog post.\n\nPost Title: "${title}"\nPost Content:\n${content || ''}`;
        break;
      case 'fix_grammar':
        promptText = `Review and correct any grammar, spelling, or phrasing issues in the following text. Preserve the markdown formatting exactly.\n\nText:\n${content || ''}`;
        break;
      case 'expand_paragraph':
        promptText = `Expand the last paragraph or add a concluding paragraph to this blog post in a professional, technical developer tone. Keep it to one concise paragraph.\n\nPost Content:\n${content || ''}`;
        break;
      case 'add_code':
        promptText = `Provide a clean, production-ready TypeScript or React code block that illustrates a key concept related to: "${title}". Use proper code comments.`;
        break;
      case 'free_prompt':
      default:
        promptText = prompt || 'Write a technical paragraph about React and Next.js.';
        break;
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    // Fallback: If Anthropic key is not set, simulate typing high-quality blog content
    if (!apiKey) {
      console.warn('ANTHROPIC_API_KEY is not set. Simulating AI output for CMS editor...');
      
      let simulatedResponse = '';
      if (action === 'improve_summary') {
        simulatedResponse = `Learn how to master Next.js and build highly optimized, production-ready applications with this comprehensive guide on advanced routing and layouts.`;
      } else if (action === 'suggest_title') {
        simulatedResponse = `1. Mastering Next.js Server Components: A Comprehensive Guide\n2. Next.js 14 Architecture Demystified for Senior Engineers\n3. High-Performance Web Development: Routing and Fetching Patterns`;
      } else if (action === 'generate_tags') {
        simulatedResponse = `nextjs, react, typescript, architecture, webdev`;
      } else if (action === 'fix_grammar') {
        simulatedResponse = content || 'Text was verified. No grammar errors detected.';
      } else if (action === 'expand_paragraph') {
        simulatedResponse = `In conclusion, adopting these advanced framework patterns allows development teams to build systems that are not only performant out-of-the-box but also maintainable over long lifecycles. By structuring clean boundaries between data fetching layers and view layouts, we safeguard code quality while optimizing critical user interactions.`;
      } else if (action === 'add_code') {
        simulatedResponse = `\`\`\`typescript\n// Example: Custom Hook for fetching paginated posts\nimport { useState, useEffect } from 'react';\n\nexport function useFetchPosts(page: number) {\n  const [data, setData] = useState([]);\n  const [loading, setLoading] = useState(true);\n\n  useEffect(() => {\n    setLoading(true);\n    fetch(\`/api/posts?page=\${page}\`)\n      .then(res => res.json())\n      .then(posts => {\n        setData(posts);\n        setLoading(false);\n      });\n  }, [page]);\n\n  return { data, loading };\n}\n\`\`\``;
      } else {
        simulatedResponse = `This is a simulated AI response demonstrating dynamic integration of the Claude model inside the editor workspace. Fill process.env.ANTHROPIC_API_KEY in your environment config to link live Claude sonnet streams.`;
      }

      const encoder = new TextEncoder();
      const customStream = new ReadableStream({
        async start(controller) {
          // Stream chunks of simulated text with typing delays
          const chunks = simulatedResponse.split(' ');
          for (let i = 0; i < chunks.length; i++) {
            const space = i === 0 ? '' : ' ';
            controller.enqueue(encoder.encode(space + chunks[i]));
            await new Promise(resolve => setTimeout(resolve, 80)); // 80ms delay
          }
          controller.close();
        }
      });

      return new Response(customStream, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }

    // Call live Anthropic messages API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        system: 'You are a writing assistant for a developer blog. Be concise and technical. Return only the requested content, no preamble.',
        messages: [{ role: 'user', content: promptText }],
        stream: true
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API return error:', errText);
      return NextResponse.json({ error: 'AI provider error' }, { status: response.status });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Stream parse transformation
    const stream = new ReadableStream({
      async start(controller) {
        if (!response.body) {
          controller.close();
          return;
        }
        const reader = response.body.getReader();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const cleaned = line.trim();
            if (cleaned.startsWith('data: ')) {
              const dataStr = cleaned.slice(6);
              if (dataStr === '[DONE]') continue;
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                  controller.enqueue(encoder.encode(parsed.delta.text));
                }
              } catch {}
            }
          }
        }
        controller.close();
      }
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });

  } catch (error) {
    console.error('Error in AI assist route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
