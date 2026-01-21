import React from 'react';
import Head from 'next/head';
import EditorGate from '../../features/editor/EditorGate';

const EditorReviewPage: React.FC & { fullBleedLayout?: boolean } = () => {
  return (
    <EditorGate>
      <Head>
        <title>Map Editor - Review</title>
        <meta name="description" content="Review map pack submissions" />
      </Head>
      <main className="min-h-screen bg-editor-page px-8 py-7 text-editor-text">
        <div className="text-[28px] font-semibold">Review Queue</div>
        <div className="text-editor-muted-strong">
          Submissions and automated validation results will appear here.
        </div>
      </main>
    </EditorGate>
  );
};

EditorReviewPage.fullBleedLayout = true;

export default EditorReviewPage;
