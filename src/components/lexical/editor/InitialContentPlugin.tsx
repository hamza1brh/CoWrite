import { $createListNode, $createListItemNode } from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createHeadingNode } from "@lexical/rich-text";
import { $getRoot, $createTextNode, $createParagraphNode } from "lexical";
import { useEffect } from "react";

// Plugin to set initial content
export default function InitialContentPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Use setTimeout to ensure the editor is fully initialized
    const timer = setTimeout(() => {
      editor.update(() => {
        const root = $getRoot();

        // Better check - also check if content is just empty
        const firstChild = root.getFirstChild();
        if (
          !firstChild ||
          (firstChild && firstChild.getTextContent().trim() === "")
        ) {
          root.clear();

          // Create proper Lexical nodes
          const heading = $createHeadingNode("h1");
          heading.append($createTextNode("Product Requirements Document"));

          const overview = $createHeadingNode("h2");
          overview.append($createTextNode("Overview"));

          const overviewText = $createParagraphNode();
          overviewText.append(
            $createTextNode(
              "This document outlines the requirements for our new collaborative document editing platform. The platform will enable real-time collaboration, AI-powered suggestions, and seamless document management."
            )
          );

          const userStoriesHeading = $createHeadingNode("h2");
          userStoriesHeading.append($createTextNode("User Stories"));

          const userStoriesList = $createListNode("bullet");

          const listItem1 = $createListItemNode();
          listItem1.append(
            $createTextNode(
              "As a user, I want to create and edit documents in real-time with my team"
            )
          );

          const listItem2 = $createListItemNode();
          listItem2.append(
            $createTextNode(
              "As a user, I want to see who else is editing the document"
            )
          );

          const listItem3 = $createListItemNode();
          listItem3.append(
            $createTextNode("As a user, I want to add comments and suggestions")
          );

          const listItem4 = $createListItemNode();
          listItem4.append(
            $createTextNode(
              "As a user, I want AI assistance for writing and editing"
            )
          );

          userStoriesList.append(listItem1, listItem2, listItem3, listItem4);

          const techHeading = $createHeadingNode("h2");
          techHeading.append($createTextNode("Technical Requirements"));

          const techText = $createParagraphNode();
          techText.append(
            $createTextNode(
              "The platform should be built using modern web technologies including React, Next.js, and WebSocket for real-time collaboration. The editor should be based on Lexical for rich text editing capabilities."
            )
          );

          const metricsHeading = $createHeadingNode("h2");
          metricsHeading.append($createTextNode("Success Metrics"));

          const metricsList = $createListNode("bullet");

          const metric1 = $createListItemNode();
          metric1.append(
            $createTextNode(
              "User engagement: 80% of users return within 7 days"
            )
          );

          const metric2 = $createListItemNode();
          metric2.append(
            $createTextNode(
              "Collaboration: Average of 3+ collaborators per document"
            )
          );

          const metric3 = $createListItemNode();
          metric3.append(
            $createTextNode("Performance: Document load time under 2 seconds")
          );

          metricsList.append(metric1, metric2, metric3);

          // Append all nodes to root
          root.append(
            heading,
            overview,
            overviewText,
            userStoriesHeading,
            userStoriesList,
            techHeading,
            techText,
            metricsHeading,
            metricsList
          );
        }
      });
    }, 100); // Small delay to ensure editor is ready

    return () => clearTimeout(timer);
  }, [editor]);

  return null;
}
