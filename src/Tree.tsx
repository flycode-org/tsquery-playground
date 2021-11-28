import { FC, useCallback, useState } from 'react';
import classNames from 'classnames';
import { Node, SyntaxKind } from 'typescript';
import './Tree.css';

const Tree: FC<{ node: Node }> = ({ node }) => {
  return (
    <pre>
      <TreeNode node={node} level={0} />
    </pre>
  );
};

export default Tree;

const TreeNode: FC<{ node: Node; level: number }> = ({ node, level }) => {
  const [open, setOpen] = useState(false);
  const handleClick = useCallback(() => setOpen((open) => !open), []);
  return (
    <>
      <span onClick={handleClick} className={classNames('toggable', { open })}>
        <span className="nc">{SyntaxKind[node.kind]}</span> <span className="p">{'{'}</span>
      </span>
      {open &&
        Object.entries(node).map(([key, value]) => {
          if (key === 'parent') {
            return null;
          }
          return (
            <div key={key}>
              {'\t'.repeat(level + 1)}
              <PropertyName name={key} />:{' '}
              {isNode(value) ? (
                <TreeNode node={value} level={level + 1} />
              ) : Array.isArray(value) ? (
                <TreeNodeArray array={value} level={level + 1} />
              ) : (
                <PrimitiveValue value={value} />
              )}
            </div>
          );
        })}
      <span>
        {open && '\t'.repeat(level)}
        <span className="p">{'}'}</span>
      </span>
    </>
  );
};

const TreeNodeArray: FC<{ array: unknown[]; level: number }> = ({ array, level }) => {
  const [open, setOpen] = useState(true);
  const handleClick = useCallback(() => setOpen((open) => !open), []);
  if (!array.length) {
    return <span className="p">[]</span>;
  }
  return (
    <>
      <span onClick={handleClick} className={classNames('toggable', { open })}>
        <span className="p">[</span>
      </span>
      {open &&
        array.map((item, i) => (
          <div key={i}>
            {'\t'.repeat(level + 1)}
            {isNode(item) ? <TreeNode node={item} level={level + 1} /> : <PrimitiveValue value={item} />}
          </div>
        ))}
      <span className="p">{open && '\t'.repeat(level)}]</span>
    </>
  );
};

const PrimitiveValue: FC<{ value: unknown }> = ({ value }) => {
  return <span className="s">{typeof value === 'string' ? JSON.stringify(value) : String(value)}</span>;
};

const PropertyName: FC<{ name: string }> = ({ name }) => {
  return <span className="nb">{name}</span>;
};

function isNode(value: unknown): value is Node {
  return Boolean(value) && typeof value === 'object' && Boolean(SyntaxKind[(value as Node).kind]);
}
