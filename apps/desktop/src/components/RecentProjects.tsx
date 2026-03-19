import { useEffect } from 'react';
import { usePersistenceStore } from '@studioflow/state';

interface RecentProjectsProps {
  /** When true, renders as an inline list (e.g. in a sidebar).
   *  When false / omitted, renders as a floating overlay. */
  inline?: boolean;
  onClose?: () => void;
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return isoString;
  }
}

export default function RecentProjects({ inline = false, onClose }: RecentProjectsProps) {
  const { recentProjects, loadRecentProjects, openProject, isLoading } =
    usePersistenceStore();

  useEffect(() => {
    loadRecentProjects();
  }, [loadRecentProjects]);

  async function handleOpen(path: string) {
    try {
      await openProject(path);
      onClose?.();
    } catch {
      // error surfaced via persistenceStore.lastError
    }
  }

  const content = (
    <div className={`recent-projects${inline ? ' recent-projects--inline' : ''}`}>
      <div className="recent-projects__header">
        <span className="recent-projects__title">Recent Projects</span>
        {!inline && onClose && (
          <button
            className="recent-projects__close-btn"
            onClick={onClose}
            title="Close"
            aria-label="Close recent projects"
          >
            ×
          </button>
        )}
      </div>

      {recentProjects.length === 0 ? (
        <div className="recent-projects__empty">
          No recent projects
        </div>
      ) : (
        <ul className="recent-projects__list" role="list">
          {recentProjects.map((rp) => (
            <li key={rp.id} className="recent-projects__item">
              <button
                className="recent-projects__item-btn"
                onClick={() => handleOpen(rp.path)}
                disabled={isLoading}
                title={rp.path}
              >
                <span className="recent-projects__item-name">{rp.name}</span>
                <span className="recent-projects__item-path">{rp.path}</span>
                <span className="recent-projects__item-date">
                  {formatDate(rp.lastOpenedAt)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  if (inline) return content;

  return (
    <div
      className="recent-projects__overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Recent projects"
    >
      <div
        className="recent-projects__backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="recent-projects__modal">{content}</div>
    </div>
  );
}
