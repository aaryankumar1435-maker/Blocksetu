import { useState } from 'react'
import { Gantt } from './Gantt'
import { BlockDetailPanel } from './BlockDetailPanel'
import { useData } from '../../context/DataContext'
import { DEPT_LABEL, DEPT_COLOR } from '../../lib/dept'
import type { Department } from '../../types'

const DEPTS: Department[] = ['ENG', 'S&T', 'TRD']

export function BlockPlanPage() {
  const { sections, blocks, togglePin, moveBlock } = useData()
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) ?? null

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <div>
            <h1 className="text-[14px] font-semibold text-text-bright">Block Plan</h1>
            <p className="text-[11px] text-text-dim">7-day horizon · {sections.length} sections · {blocks.length} blocks</p>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-text-dim">
            {DEPTS.map((d) => (
              <span key={d} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: DEPT_COLOR[d] }} />
                {DEPT_LABEL[d]}
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm border border-multi" style={{ background: 'repeating-linear-gradient(45deg, var(--color-eng) 0 3px, var(--color-snt) 3px 6px)' }} />
              Multi-department
            </span>
          </div>
        </div>
        <div className="flex-1 overflow-auto px-4 py-3">
          <Gantt
            sections={sections}
            blocks={blocks}
            selectedBlockId={selectedBlockId}
            onSelectBlock={setSelectedBlockId}
            onMoveBlock={(id, start, end) => void moveBlock(id, start, end)}
          />
        </div>
      </div>

      {selectedBlock && (
        <div className="w-[340px] shrink-0">
          <BlockDetailPanel block={selectedBlock} onTogglePin={(id) => void togglePin(id)} onClose={() => setSelectedBlockId(null)} />
        </div>
      )}
    </div>
  )
}
