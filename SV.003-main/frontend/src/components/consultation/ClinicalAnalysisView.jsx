import React, { useMemo } from "react";
import { cleanClinicalDisplayText } from "../../lib/consultationPdf";
import "./clinicalAnalysisView.css";

function renderInline(text) {
  if (!text) return null;
  const nodes = [];
  const pattern = /(\*\*([^*]+)\*\*|\*([^*\n]+)\*)/g;
  let last = 0;
  let match;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }
    if (match[2] != null) {
      nodes.push(<strong key={`b-${key++}`}>{match[2]}</strong>);
    } else if (match[3] != null) {
      nodes.push(<em key={`i-${key++}`}>{match[3]}</em>);
    }
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    nodes.push(text.slice(last));
  }

  return nodes.length ? nodes : text;
}

function parseBlocks(source) {
  const lines = String(source || "").replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    if (/^---+$/.test(trimmed) || /^\*\*\*+$/.test(trimmed)) {
      blocks.push({ type: "hr" });
      i += 1;
      continue;
    }

    const heading = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      blocks.push({
        type: "heading",
        level: heading[1].length,
        text: heading[2].trim(),
      });
      i += 1;
      continue;
    }

    if (/^[-*•]\s+/.test(trimmed) || /^\d+[.)]\s+/.test(trimmed)) {
      const items = [];
      while (i < lines.length) {
        const itemLine = lines[i].trim();
        if (!itemLine) break;
        const bullet = itemLine.match(/^[-*•]\s+(.+)$/);
        const numbered = itemLine.match(/^\d+[.)]\s+(.+)$/);
        if (!bullet && !numbered) break;
        items.push((bullet || numbered)[1].trim());
        i += 1;
      }
      blocks.push({ type: "list", ordered: Boolean(trimmed.match(/^\d/)), items });
      continue;
    }

    const para = [trimmed];
    i += 1;
    while (i < lines.length) {
      const next = lines[i].trim();
      if (!next) break;
      if (/^#{1,4}\s+/.test(next)) break;
      if (/^---+$/.test(next) || /^\*\*\*+$/.test(next)) break;
      if (/^[-*•]\s+/.test(next) || /^\d+[.)]\s+/.test(next)) break;
      para.push(next);
      i += 1;
    }
    blocks.push({ type: "paragraph", text: para.join(" ") });
  }

  return blocks;
}

function BlockView({ block, index }) {
  if (block.type === "hr") {
    return <hr key={index} className="clinical-md-hr" />;
  }

  if (block.type === "heading") {
    const Tag = block.level === 1 ? "h3" : block.level === 2 ? "h4" : "h5";
    return (
      <Tag key={index} className={`clinical-md-h clinical-md-h${block.level}`}>
        {renderInline(block.text)}
      </Tag>
    );
  }

  if (block.type === "list") {
    const ListTag = block.ordered ? "ol" : "ul";
    return (
      <ListTag key={index} className="clinical-md-list">
        {block.items.map((item, itemIndex) => (
          <li key={itemIndex}>{renderInline(item)}</li>
        ))}
      </ListTag>
    );
  }

  return (
    <p key={index} className="clinical-md-p">
      {renderInline(block.text)}
    </p>
  );
}

/**
 * Muestra el análisis clínico con formato profesional.
 * No altera el texto fuente ni el prompt: solo la presentación.
 */
export function ClinicalAnalysisView({ text, className = "" }) {
  const cleaned = useMemo(() => {
    const raw = String(text || "").replace(/\\n/g, "\n").replace(/\\t/g, "\t");
    return cleanClinicalDisplayText(raw);
  }, [text]);
  const blocks = useMemo(() => parseBlocks(cleaned), [cleaned]);

  if (!cleaned) return null;

  return (
    <div className={`clinical-md ${className}`.trim()}>
      {blocks.map((block, index) => (
        <BlockView key={index} block={block} index={index} />
      ))}
    </div>
  );
}

export default ClinicalAnalysisView;
