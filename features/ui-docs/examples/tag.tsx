import Tag from '@/shared/components/tag';

export function Variants() {
  return (
    <>
      <Tag>Draft</Tag>
      <Tag variant="primary">New</Tag>
      <Tag variant="success">Synced</Tag>
      <Tag variant="warning">Beta</Tag>
      <Tag variant="danger">Failed</Tag>
    </>
  );
}
