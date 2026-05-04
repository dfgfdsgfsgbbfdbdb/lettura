import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FolderPlus } from "lucide-react";
import { Button } from "@radix-ui/themes";

interface CollectionSuggestionProps {
  suggestion: { collectionName: string; articleCount: number } | null;
  withNotesCount: number;
  onCreateCollection: (name: string) => Promise<void>;
}

export function CollectionSuggestion({
  suggestion,
  withNotesCount,
  onCreateCollection,
}: CollectionSuggestionProps) {
  const { t } = useTranslation();
  const [showInput, setShowInput] = useState(false);
  const [newName, setNewName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setIsCreating(true);
    try {
      await onCreateCollection(name);
      setNewName("");
      setShowInput(false);
    } catch {
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="mb-5">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--gray-10)]">
        {t("starred.suggest.title")}
      </div>
      <div className="rounded-lg border border-[var(--gray-5)] bg-[var(--color-panel-solid)] p-3">
        {suggestion ? (
          <>
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--gray-12)]">
              <FolderPlus size={14} />
              {t("starred.suggest.suggested_name", {
                name: suggestion.collectionName,
              })}
            </div>
            <p className="mt-2 text-xs leading-5 text-[var(--gray-11)]">
              {t("starred.suggest.suggested_reason", {
                count: suggestion.articleCount,
                name: suggestion.collectionName,
              })}
            </p>
            {showInput ? (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                  }}
                  placeholder={t("starred.collection_input_placeholder")}
                  className="min-w-0 flex-1 rounded-md border border-[var(--gray-7)] bg-[var(--gray-2)] px-2 py-1 text-xs text-[var(--gray-12)] outline-none focus:border-[var(--accent-8)]"
                  disabled={isCreating}
                />
                <Button
                  size="1"
                  onClick={handleCreate}
                  disabled={!newName.trim() || isCreating}
                >
                  {isCreating
                    ? t("Saving")
                    : t("starred.suggest.create_button")}
                </Button>
              </div>
            ) : (
              <Button
                className="mt-3"
                size="1"
                onClick={() => {
                  setNewName(suggestion.collectionName);
                  setShowInput(true);
                }}
              >
                {t("starred.suggest.create_button")}
              </Button>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--gray-12)]">
              <FolderPlus size={14} />
              {t("starred.suggest.create")}
            </div>
            <p className="mt-2 text-xs leading-5 text-[var(--gray-11)]">
              {t("starred.suggest.has_notes", {
                count: withNotesCount,
              })}
            </p>
            {showInput ? (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                  }}
                  placeholder={t("starred.collection_input_placeholder")}
                  className="min-w-0 flex-1 rounded-md border border-[var(--gray-7)] bg-[var(--gray-2)] px-2 py-1 text-xs text-[var(--gray-12)] outline-none focus:border-[var(--accent-8)]"
                  disabled={isCreating}
                />
                <Button
                  size="1"
                  onClick={handleCreate}
                  disabled={!newName.trim() || isCreating}
                >
                  {isCreating
                    ? t("Saving")
                    : t("starred.suggest.create_button")}
                </Button>
              </div>
            ) : (
              <Button
                className="mt-3"
                size="1"
                onClick={() => setShowInput(true)}
              >
                {t("starred.suggest.create_button")}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
