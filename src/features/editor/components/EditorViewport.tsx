import React from 'react';

type EditorViewportProps = {
  title?: string;
  subtitle?: string;
};

const EditorViewport: React.FC<EditorViewportProps> = ({
  title = 'Editor viewport',
  subtitle = 'Renderer hookup pending',
}) => {
  return (
    <section className="absolute inset-0 overflow-hidden bg-editor-viewport">
      <div className="grid h-full place-content-center text-center bg-editor-grid bg-[length:56px_56px]">
        <div className="mb-1.5 text-[20px] font-semibold">{title}</div>
        <div className="text-editor-muted">{subtitle}</div>
      </div>
    </section>
  );
};

export default EditorViewport;
