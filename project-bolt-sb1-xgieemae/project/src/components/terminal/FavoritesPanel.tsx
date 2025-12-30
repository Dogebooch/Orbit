import React, { useState } from 'react';
import { Star, Trash2, Play, Plus, X } from 'lucide-react';

interface FavoriteCommand {
  id: string;
  command: string;
  description: string;
  category: string;
  orderIndex: number;
}

interface FavoritesPanelProps {
  favorites: FavoriteCommand[];
  onExecute: (command: string) => void;
  onAdd: (command: string, description: string, category: string) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}

export function FavoritesPanel({ favorites, onExecute, onAdd, onRemove, onClose }: FavoritesPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCommand, setNewCommand] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('custom');

  const handleAdd = () => {
    if (!newCommand.trim()) return;
    onAdd(newCommand, newDescription, newCategory);
    setNewCommand('');
    setNewDescription('');
    setNewCategory('custom');
    setShowAddForm(false);
  };

  const categories = Array.from(new Set(favorites.map((f) => f.category)));

  return (
    <div className="w-80 border-r border-gray-700 bg-gray-900 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          <h3 className="font-semibold text-gray-200">Favorites</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-1 text-gray-400 hover:text-gray-300 hover:bg-gray-800 rounded transition-colors"
            title="Add favorite"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-300 hover:bg-gray-800 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {showAddForm && (
          <div className="p-3 bg-gray-800 rounded-lg border border-gray-700 space-y-2 animate-fade-in">
            <input
              type="text"
              value={newCommand}
              onChange={(e) => setNewCommand(e.target.value)}
              placeholder="Command"
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-gray-300"
            />
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Description"
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-gray-300"
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-gray-300"
            >
              <option value="custom">Custom</option>
              <option value="git">Git</option>
              <option value="npm">NPM</option>
              <option value="taskmaster">TaskMaster</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {favorites.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            <Star className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No favorite commands yet</p>
            <p className="text-xs mt-1">Click + to add your first favorite</p>
          </div>
        ) : (
          <>
            {categories.map((category) => (
              <div key={category}>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {category}
                </h4>
                <div className="space-y-2">
                  {favorites
                    .filter((f) => f.category === category)
                    .map((fav) => (
                      <div
                        key={fav.id}
                        className="group p-3 bg-gray-800 hover:bg-gray-750 rounded-lg border border-gray-700 hover:border-gray-600 transition-all"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-300 font-medium truncate">
                              {fav.description || fav.command}
                            </p>
                            <code className="text-xs text-gray-500 font-mono block truncate mt-1">
                              {fav.command}
                            </code>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => onExecute(fav.command)}
                              className="p-1 text-green-400 hover:text-green-300 hover:bg-gray-700 rounded transition-colors"
                              title="Execute"
                            >
                              <Play className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => onRemove(fav.id)}
                              className="p-1 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded transition-colors"
                              title="Remove"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
