import React, { useState } from 'react';
import { Textarea, Button } from '../../ui';
import { Upload, Image as ImageIcon, X, Lightbulb, CheckCircle2, Target, Users, Sparkles, MessageSquare, Code, Palette } from 'lucide-react';
import type { ResearchSection } from './researchConfig';

interface ResearchImage {
  id: string;
  imageData: string;
  caption: string;
  orderIndex: number;
}

interface ResearchSectionProps {
  section: ResearchSection;
  value: string;
  images: ResearchImage[];
  onChange: (value: string) => void;
  onImageAdd: (imageData: string, caption: string) => Promise<void>;
  onImageRemove: (imageId: string) => Promise<void>;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

export function ResearchSectionCard({
  section,
  value,
  images,
  onChange,
  onImageAdd,
  onImageRemove,
  onSave,
  isSaving,
}: ResearchSectionProps) {
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newCaption, setNewCaption] = useState('');
  const [showImageUpload, setShowImageUpload] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        await onImageAdd(base64String, newCaption);
        setNewCaption('');
        setShowImageUpload(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const iconMap: Record<string, React.ElementType> = {
    Target,
    Users,
    Sparkles,
    MessageSquare,
    Code,
    Palette,
  };

  const Icon = iconMap[section.icon] || Lightbulb;
  const hasContent = value && value.length > 10;

  return (
    <div className="bg-primary-900/80 rounded-2xl p-6 border border-primary-700/50">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-900/50 rounded-lg">
            <Icon className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-primary-100">{section.title}</h3>
            <p className="text-sm text-primary-400 mt-1">{section.description}</p>
          </div>
        </div>
        {hasContent && (
          <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
        )}
      </div>

      <div className="mb-4 p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
        <div className="flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-blue-300 font-medium mb-1">Why this matters:</p>
            <p className="text-blue-200/90">{section.whyItMatters}</p>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-primary-300 mb-2">Research Notes</label>
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={section.placeholder}
          rows={section.rows}
          className="font-mono text-sm"
        />
      </div>

      {section.supportsImages && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-primary-300">
              <ImageIcon className="w-4 h-4 inline mr-1" />
              Images & Screenshots
            </label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowImageUpload(!showImageUpload)}
            >
              <Upload className="w-4 h-4 mr-2" />
              Add Image
            </Button>
          </div>

          {showImageUpload && (
            <div className="mb-4 p-4 bg-primary-800/50 rounded-lg border border-primary-700 animate-fade-in">
              <input
                type="text"
                value={newCaption}
                onChange={(e) => setNewCaption(e.target.value)}
                placeholder="Image caption (optional)"
                className="w-full px-3 py-2 bg-primary-900 border border-primary-700 rounded mb-2 text-primary-100"
              />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="text-sm text-primary-300"
              />
              {uploadingImage && (
                <p className="text-sm text-primary-500 mt-2">Uploading image...</p>
              )}
            </div>
          )}

          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {images.map((image) => (
                <div key={image.id} className="relative group">
                  <img
                    src={image.imageData}
                    alt={image.caption || 'Research image'}
                    className="w-full h-32 object-cover rounded-lg border border-primary-700"
                  />
                  {image.caption && (
                    <p className="text-xs text-primary-400 mt-1 truncate">{image.caption}</p>
                  )}
                  <button
                    onClick={() => onImageRemove(image.id)}
                    className="absolute top-2 right-2 p-1 bg-red-600 hover:bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mb-4 p-3 bg-primary-800/30 rounded-lg">
        <p className="text-xs font-medium text-primary-400 mb-2">Best Practices:</p>
        <ul className="text-xs text-primary-400 space-y-1">
          {section.bestPractices.map((practice, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-primary-600 mt-0.5">•</span>
              <span>{practice}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex justify-end">
        <Button onClick={onSave} loading={isSaving} disabled={!value.trim()}>
          Save Section
        </Button>
      </div>
    </div>
  );
}
