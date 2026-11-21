import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Save, Video, Upload, CheckCircle2, AlertCircle, Loader2, Globe, X, Trash2 } from 'lucide-react';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { motion, AnimatePresence } from 'motion/react';

export default function SettingsManagement() {
  const [videoUrl, setVideoUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [socialLinks, setSocialLinks] = useState({
    instagram: '',
    facebook: '',
    twitter: '',
    whatsapp: ''
  });
  const [contactEmail, setContactEmail] = useState('');
  const [automationEmail, setAutomationEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingTarget, setUploadingTarget] = useState<'video' | 'logo' | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    async function fetchSettings() {
      try {
        const docRef = doc(db, 'settings', 'global');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setVideoUrl(data.landingVideoUrl || '');
          setLogoUrl(data.logoUrl || '');
          if (data.socialLinks) {
            setSocialLinks(prev => ({ ...prev, ...data.socialLinks }));
          }
          setContactEmail(data.contactEmail || '');
          setAutomationEmail(data.automationEmail || '');
        }
      } catch (error) {
        console.error(error);
        showToast('Failed to load settings.', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'video' | 'logo') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingTarget(target);
    try {
      const url = await uploadToCloudinary(file, target === 'video' ? 'video' : 'image');
      if (target === 'video') setVideoUrl(url);
      else setLogoUrl(url);
      showToast(`${target === 'video' ? 'Video' : 'Logo'} uploaded. Click Save Changes to publish.`);
    } catch (error) {
      console.error(error);
      showToast('Upload failed. Please try again.', 'error');
    } finally {
      setUploadingTarget(null);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        landingVideoUrl: videoUrl.trim(),
        logoUrl: logoUrl.trim(),
        socialLinks,
        contactEmail: contactEmail.trim(),
        automationEmail: automationEmail.trim(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      showToast('Settings updated successfully.', 'success');
    } catch (error) {
      console.error(error);
      showToast('Failed to update settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center gap-3 font-mono text-xs uppercase tracking-widest text-neutral-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 md:space-y-10 pb-20 md:pb-8">
      <header className="space-y-2 px-1">
        <h2 className="text-2xl md:text-3xl font-display uppercase tracking-tight">System Settings</h2>
        <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest leading-relaxed max-w-lg">
          Configure global brand assets, landing background video, and contact channels.
        </p>
      </header>

      <div className="bg-neutral-900 border border-white/5 p-6 md:p-8 rounded-2xl md:rounded-3xl space-y-10">
        {/* Logo Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
              <Upload className="w-5 h-5 text-neutral-300" />
            </div>
            <div>
              <h3 className="font-display uppercase">Brand Identity</h3>
              <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Global Logo Configuration</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-black/60 border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center">
              <div className="relative w-full md:w-auto">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'logo')}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  disabled={uploadingTarget !== null}
                />
                <button
                  type="button"
                  disabled={uploadingTarget !== null}
                  className="w-full md:w-auto px-8 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-mono text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {uploadingTarget === 'logo' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {uploadingTarget === 'logo' ? 'Uploading...' : 'Browse Logo'}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">Logo Image URL</label>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl('')}
                    className="text-[9px] font-mono uppercase tracking-widest text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
              <input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-black border border-white/10 rounded-xl p-3.5 focus:border-white transition-colors outline-none font-mono text-xs"
              />
            </div>
          </div>

          {logoUrl && (
            <div className="h-44 w-full bg-black border border-white/5 rounded-2xl flex items-center justify-center p-6 relative">
              <img src={logoUrl} alt="Logo Preview" className="max-h-full object-contain" />
            </div>
          )}
        </div>

        <hr className="border-white/5" />

        {/* Video Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
              <Video className="w-5 h-5 text-neutral-300" />
            </div>
            <div>
              <h3 className="font-display uppercase">Landing Experience</h3>
              <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Hero Background Video</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-black/60 border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center">
              <div className="relative w-full md:w-auto">
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleFileUpload(e, 'video')}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  disabled={uploadingTarget !== null}
                />
                <button
                  type="button"
                  disabled={uploadingTarget !== null}
                  className="w-full md:w-auto px-8 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-mono text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {uploadingTarget === 'video' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Video className="w-3.5 h-3.5" />}
                  {uploadingTarget === 'video' ? 'Uploading...' : 'Browse Video'}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">Video URL</label>
                {videoUrl && (
                  <button
                    type="button"
                    onClick={() => setVideoUrl('')}
                    className="text-[9px] font-mono uppercase tracking-widest text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-black border border-white/10 rounded-xl p-3.5 focus:border-white transition-colors outline-none font-mono text-xs pr-10"
                />
                {videoUrl && <CheckCircle2 className="w-4 h-4 text-emerald-400 absolute right-3.5 top-1/2 -translate-y-1/2" />}
              </div>
            </div>
          </div>

          {videoUrl && (
            <div className="aspect-video w-full bg-black border border-white/5 rounded-2xl overflow-hidden relative">
              <video
                src={videoUrl}
                className="w-full h-full object-cover opacity-75"
                autoPlay
                muted
                loop
                playsInline
              />
            </div>
          )}
        </div>

        <hr className="border-white/5" />

        {/* Social & Contact Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
              <Globe className="w-5 h-5 text-neutral-300" />
            </div>
            <div>
              <h3 className="font-display uppercase">Network & Support</h3>
              <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Social links and contact info</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">Instagram URL</label>
              <input
                value={socialLinks.instagram}
                onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                placeholder="https://instagram.com/..."
                className="w-full bg-black border border-white/10 rounded-xl p-3.5 focus:border-white transition-colors outline-none font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">Facebook URL</label>
              <input
                value={socialLinks.facebook}
                onChange={(e) => setSocialLinks({ ...socialLinks, facebook: e.target.value })}
                placeholder="https://facebook.com/..."
                className="w-full bg-black border border-white/10 rounded-xl p-3.5 focus:border-white transition-colors outline-none font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">WhatsApp (Phone Number Only)</label>
              <input
                value={socialLinks.whatsapp}
                onChange={(e) => setSocialLinks({ ...socialLinks, whatsapp: e.target.value })}
                placeholder="201234567890"
                className="w-full bg-black border border-white/10 rounded-xl p-3.5 focus:border-white transition-colors outline-none font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">Contact Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="concierge@domain.com"
                className="w-full bg-black border border-white/10 rounded-xl p-3.5 focus:border-white transition-colors outline-none font-mono text-xs"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-blue-400">Admin Notification Email (For Orders)</label>
              <input
                type="email"
                value={automationEmail}
                onChange={(e) => setAutomationEmail(e.target.value)}
                placeholder="orders@aurora.suite"
                className="w-full bg-black border border-blue-500/20 rounded-xl p-3.5 focus:border-blue-400 transition-colors outline-none font-mono text-xs"
              />
              <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">
                This email receives order notifications and customer messages.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-white/10">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || uploadingTarget !== null}
            className="w-full md:w-auto px-10 py-3.5 bg-white text-black font-mono text-[10px] uppercase font-bold tracking-widest rounded-xl hover:bg-neutral-200 transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[999] max-w-sm w-full bg-neutral-900 border border-white/10 px-6 py-4 flex items-center justify-between gap-4 shadow-2xl rounded-xl backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-200">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-neutral-500 hover:text-white"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
