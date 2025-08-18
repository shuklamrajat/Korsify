import { useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';
import '@/styles/rich-text-viewer.css';

interface RichTextViewerProps {
  content: string;
  className?: string;
  enableCitations?: boolean;
  sourceReferences?: any[];
  onCitationClick?: (citationId: string) => void;
}

export default function RichTextViewer({ 
  content, 
  className,
  enableCitations = false,
  sourceReferences = [],
  onCitationClick
}: RichTextViewerProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Configure DOMPurify to allow necessary HTML elements and attributes
  const sanitizeConfig = {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'strong', 'em', 'u', 'del', 's', 'mark',
      'ul', 'ol', 'li',
      'blockquote', 'code', 'pre',
      'a', 'img', 'figure', 'figcaption',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span', 'sup', 'sub'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'title',
      'src', 'alt', 'width', 'height', 'loading',
      'class', 'style', 'id',
      'data-citation-id', 'data-*'
    ],
    ALLOW_DATA_ATTR: true,
    KEEP_CONTENT: true,
    ADD_ATTR: ['target', 'rel'] // Allow target and rel for links
  };

  useEffect(() => {
    if (contentRef.current && enableCitations && sourceReferences.length > 0) {
      // Process citations in the content
      const processedContent = processCitations(content, sourceReferences);
      // Sanitize the processed content before setting innerHTML
      const sanitizedContent = DOMPurify.sanitize(processedContent, sanitizeConfig);
      contentRef.current.innerHTML = sanitizedContent;
      
      // Add event listeners to citation elements
      const citations = contentRef.current.querySelectorAll('.citation-link');
      citations.forEach((citation) => {
        citation.addEventListener('click', (e) => {
          e.preventDefault();
          const citationId = (e.target as HTMLElement).dataset.citationId;
          if (citationId && onCitationClick) {
            onCitationClick(citationId);
          }
        });
      });
    } else if (contentRef.current) {
      // Simply set the HTML content if no citations processing needed
      // Sanitize the content before setting innerHTML
      const sanitizedContent = DOMPurify.sanitize(content, sanitizeConfig);
      contentRef.current.innerHTML = sanitizedContent;
    }

    // Process any embedded elements for better display
    if (contentRef.current) {
      // Process images
      const images = contentRef.current.querySelectorAll('img');
      images.forEach((img) => {
        img.classList.add('rich-text-image');
        // Add loading lazy attribute
        img.loading = 'lazy';
        
        // Wrap images in a figure element if not already wrapped
        if (img.parentElement?.tagName !== 'FIGURE') {
          const figure = document.createElement('figure');
          figure.className = 'rich-text-figure';
          img.parentNode?.insertBefore(figure, img);
          figure.appendChild(img);
        }
      });

      // Process links to open in new tab
      const links = contentRef.current.querySelectorAll('a');
      links.forEach((link) => {
        if (!link.classList.contains('citation-link')) {
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.classList.add('rich-text-link');
        }
      });

      // Process code blocks
      const codeBlocks = contentRef.current.querySelectorAll('pre code');
      codeBlocks.forEach((codeBlock) => {
        codeBlock.classList.add('rich-text-code');
      });

      // Process special content blocks (key concepts, examples, etc.)
      processSpecialBlocks(contentRef.current);
    }
  }, [content, enableCitations, sourceReferences, onCitationClick]);

  const processCitations = (text: string, references: any[]) => {
    // Pattern to match citations like [1], [2], etc.
    const citationPattern = /\[(\d+)\]/g;
    
    return text.replace(citationPattern, (match, citationNumber) => {
      const index = parseInt(citationNumber) - 1;
      const reference = references[index];
      
      if (reference) {
        return `<sup class="citation">
          <a href="#" class="citation-link" data-citation-id="${reference.id}" 
             title="${reference.title || reference.source}">
            [${citationNumber}]
          </a>
        </sup>`;
      }
      return match;
    });
  };

  const processSpecialBlocks = (container: HTMLElement) => {
    // Find all special content blocks and ensure they have proper icons
    const specialBlocks = container.querySelectorAll('.bg-blue-50, .bg-green-50, .bg-red-50, .bg-yellow-50, .bg-purple-50, .bg-gray-50');
    
    specialBlocks.forEach((block) => {
      block.classList.add('rich-text-special-block');
      
      // Add hover effect
      block.addEventListener('mouseenter', () => {
        block.classList.add('rich-text-special-block-hover');
      });
      
      block.addEventListener('mouseleave', () => {
        block.classList.remove('rich-text-special-block-hover');
      });
    });

    // Process lists for better formatting
    const lists = container.querySelectorAll('ul, ol');
    lists.forEach((list) => {
      list.classList.add('rich-text-list');
    });

    // Process headings
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach((heading) => {
      heading.classList.add('rich-text-heading');
      
      // Add anchor links to headings
      const id = heading.textContent?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') || '';
      heading.id = id;
      
      // Create anchor link
      const anchor = document.createElement('a');
      anchor.href = `#${id}`;
      anchor.className = 'rich-text-heading-anchor';
      anchor.innerHTML = '#';
      anchor.setAttribute('aria-label', 'Link to this section');
      heading.appendChild(anchor);
    });

    // Process tables
    const tables = container.querySelectorAll('table');
    tables.forEach((table) => {
      // Wrap table in a scrollable container
      const wrapper = document.createElement('div');
      wrapper.className = 'rich-text-table-wrapper';
      table.parentNode?.insertBefore(wrapper, table);
      wrapper.appendChild(table);
      table.classList.add('rich-text-table');
    });

    // Process blockquotes
    const blockquotes = container.querySelectorAll('blockquote');
    blockquotes.forEach((blockquote) => {
      blockquote.classList.add('rich-text-blockquote');
    });
  };

  return (
    <div 
      ref={contentRef}
      className={cn(
        "rich-text-viewer",
        "prose prose-lg max-w-none",
        "text-gray-800",
        className
      )}
    />
  );
}