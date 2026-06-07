import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button, TableCellLayout } from '@fluentui/react-components';
import {
  DeleteRegular,
  EditRegular,
  EyeOffRegular,
  EyeRegular,
  ReOrderDotsVerticalRegular,
} from '@fluentui/react-icons';
import { type RuleDetailItem } from 'lux-js-sdk';
import React from 'react';
import RuleCell from '@/components/pages/Data/Connections/RuleTag';
import { useDangerStyles } from '@/hooks';
import styles from './index.module.css';

interface DraggableRowProps {
  item: RuleDetailItem;
  isDisabled: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function DraggableRow({ item, isDisabled, onToggle, onEdit, onDelete }: DraggableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.ruleType + ',' + item.payload + ',' + item.policy,
  });

  const inlineStyles = useDangerStyles();

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: isDragging ? 'var(--colorNeutralBackground3)' : undefined,
    display: 'flex',
    alignItems: 'center',
    borderBottom: '1px solid var(--colorNeutralStroke2)',
    padding: '4px 0',
  };

  return (
    <div ref={setNodeRef} style={style}>
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        style={{ cursor: 'grab', padding: '4px 8px', color: 'var(--colorNeutralForeground3)', flexShrink: 0 }}
        title="Drag to reorder"
      >
        <ReOrderDotsVerticalRegular />
      </div>

      {/* Rule type */}
      <div style={{ width: 110, flexShrink: 0, fontSize: 12, color: 'var(--colorNeutralForeground2)' }}>
        {item.ruleType}
      </div>

      {/* Payload */}
      <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>
        <span style={isDisabled ? { textDecoration: 'line-through', opacity: 0.5 } : undefined}>
          {item.payload}
        </span>
      </div>

      {/* Policy */}
      <div style={{ width: 100, flexShrink: 0 }}>
        <RuleCell value={item} />
      </div>

      {/* Actions */}
      <div className={styles.actionBtns} style={{ flexShrink: 0 }}>
        <Button
          icon={isDisabled ? <EyeRegular /> : <EyeOffRegular />}
          onClick={onToggle}
          size="small"
          title={isDisabled ? 'Enable rule' : 'Disable rule'}
          appearance="transparent"
        />
        <Button
          icon={<EditRegular />}
          onClick={onEdit}
          size="small"
          appearance="transparent"
        />
        <Button
          icon={<DeleteRegular className={inlineStyles.danger} />}
          onClick={onDelete}
          size="small"
          appearance="transparent"
        />
      </div>
    </div>
  );
}
