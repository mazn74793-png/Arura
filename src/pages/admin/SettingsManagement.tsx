import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Save, Video, Upload, CheckCircle2 } from 'lucide-react';

declare global {
  interface Window {
    cloudinary: any;
  }
}

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const docRef = doc(db, 'settings', 'global');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setVideoUrl(data.landingVideoUrl || '');
          setLogoUrl(data.logoUrl || '');
          if (data.socialLinks) setSocialLinks({ ...socialLinks, ...data.socialLinks });
          setContactEmail(data.contactEmail || '');
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleCloudinaryUpload = (target: 'video' | 'logo') => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      alert("Cloudinary configuration missing.");
      return;
    }

    setUploading(true);
    const myWidget = window.cloudinary.createUploadWidget(
      {
        cloudName: cloudName,
        uploadPreset: uploadPreset,
        resourceType: target === 'video' ? 'video' : 'image',
        multiple: false,
        maxFiles: 1,
        styles: {
          palette: {
            window: "#000000",
            sourceBg: "#000000",
            windowBorder: "#ffffff33",
            tabIcon: "#FFFFFF",
            inactiveTabIcon: "#8E9FBB",
            menuIcons: "#2AD9FF",
            link: "#FFFFFF",
            action: "#FFFFFF",
            inProgress: "#FFFFFF",
            complete: "#FFFFFF",
            error: "#EA2727",
            textDark: "#000000",
            textLight: "#FFFFFF"
          }
        }
      },
      (error: any, result: any) => {
        if (!error && result && result.event === "success") {
          if (target === 'video') setVideoUrl(result.info.secure_url);
          else setLogoUrl(result.info.secure_url);
          setUploading(false);
        } else if (error) {
          console.error(error);
          setUploading(false);
        }
      }
    );
    myWidget.open();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        landingVideoUrl: videoUrl,
        logoUrl: logoUrl,
        socialLinks: socialLinks,
        contactEmail: contactEmail,
        updatedAt: serverTimestamp()
      }, { merge: true });
      alert('Settings updated successfully.');
    } catch (error) {
      console.error(error);
      alert('Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center font-mono text-xs uppercase tracking-widest py-24">Loading settings...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 md:space-y-12 pb-20 md:pb-0">
      <header className="space-y-4 px-2">
        <h2 className="text-2xl md:text-3xl font-display uppercase tracking-tight">System Settings</h2>
        <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest leading-relaxed max-w-lg">
          Configure the global behavior and visual assets of the Aurora experience.
        </p>
      </header>

      <div className="bg-neutral-900 border border-white/5 p-6 md:p-8 rounded-2xl md:rounded-3xl space-y-10 md:space-y-12">
        {/* Logo Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/5 rounded-xl">
              <Upload className="w-5 h-5 text-neutral-400" />
            </div>
            <div>
              <h3 className="font-display uppercase">Brand Identity</h3>
              <p className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest">Global Logo Configuration</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="p-6 bg-black border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
               <button 
                onClick={() => handleCloudinaryUpload('logo')}
                className="w-full md:w-auto px-8 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-mono text-[10px] uppercase tracking-widest transition-all"
               >
                 Upload Logo
               </button>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Logo Image URL</label>
              <input 
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="HTTPS://..."
                className="w-full bg-black border border-white/10 p-4 focus:border-white transition-colors outline-none font-mono text-xs" 
              />
            </div>
          </div>
          {logoUrl && (
            <div className="h-48 w-full bg-black border border-white/5 rounded-2xl flex items-center justify-center p-8">
              <img src={logoUrl} alt="Logo Preview" className="max-h-full object-contain" />
            </div>
          )}
        </div>

        <hr className="border-white/5" />

        {/* Video Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/5 rounded-xl">
              <Video className="w-5 h-5 text-neutral-400" />
            </div>
            <div>
              <h3 className="font-display uppercase">Landing Experience</h3>
              <p className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest">Cinema background video</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-4">
              <div className="p-6 bg-black border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
                 <button 
                  onClick={() => handleCloudinaryUpload('video')}
                  className="w-full md:w-auto px-8 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-mono text-[10px] uppercase tracking-widest transition-all"
                 >
                   Upload Video
                 </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Manual URL Entry</label>
                <div className="relative">
                  <input 
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="HTTPS://..."
                    className="w-full bg-black border border-white/10 p-4 focus:border-white transition-colors outline-none font-mono text-xs pr-12" 
                  />
                  {videoUrl && <CheckCircle2 className="w-4 h-4 text-green-500 absolute right-4 top-1/2 -translate-y-1/2" />}
                </div>
              </div>
            </div>
          </div>
          
          {videoUrl && (
            <div className="aspect-video w-full bg-black border border-white/5 rounded-2xl overflow-hidden relative group">
              <video 
                src={videoUrl} 
                className="w-full h-full object-cover opacity-60"
                autoPlay 
                muted 
                loop 
              />
            </div>
          )}
        </div>

        <hr className="border-white/5" />

        {/* Social & Contact Section */}
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/5 rounded-xl">
              <Upload className="w-5 h-5 text-neutral-400" />
            </div>
            <div>
              <h3 className="font-display uppercase">Network & Support</h3>
              <p className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest">Social links and contact info</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Instagram URL</label>
              <input 
                value={socialLinks.instagram}
                onChange={(e) => setSocialLinks({...socialLinks, instagram: e.target.value})}
                placeholder="HTTPS://INSTAGRAM.COM/..."
                className="w-full bg-black border border-white/10 p-4 focus:border-white transition-colors outline-none font-mono text-xs" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Facebook URL</label>
              <input 
                value={socialLinks.facebook}
                onChange={(e) => setSocialLinks({...socialLinks, facebook: e.target.value})}
                placeholder="HTTPS://FACEBOOK.COM/..."
                className="w-full bg-black border border-white/10 p-4 focus:border-white transition-colors outline-none font-mono text-xs" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">WhatsApp (Phone Number Only)</label>
              <input 
                value={socialLinks.whatsapp}
                onChange={(e) => setSocialLinks({...socialLinks, whatsapp: e.target.value})}
                placeholder="201234567890"
                className="w-full bg-black border border-white/10 p-4 focus:border-white transition-colors outline-none font-mono text-xs" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Contact Email</label>
              <input 
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="CONCIERGE@DOMAIN.COM"
                className="w-full bg-black border border-white/10 p-4 focus:border-white transition-colors outline-none font-mono text-xs" 
              />
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10">
           <button 
            onClick={handleSave}
            disabled={saving || uploading}
            className="w-full md:w-auto px-12 py-4 bg-white text-black font-mono text-[10px] uppercase font-bold tracking-widest hover:bg-neutral-200 transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? 'Verifying...' : 'Commit Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
