/**
 * AMMAR Hub — Admin Panel Script
 * Manages dynamic links, profile info, audio settings & saves to localStorage / JSON
 * Includes: Mobile song uploader via FileReader → localStorage blob storage
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'ammar_hub_settings';
  const AUDIO_BLOB_KEY = 'ammar_custom_audio';       // base64 audio data
  const AUDIO_NAME_KEY = 'ammar_custom_audio_name';  // display name

  const defaultSettings = {
    profile: {
      name: 'AMMAR',
      bio: 'DIGITAL ARCHITECT // NEXO COLLECTIVE',
      avatar: 'assets/profile.jpg',
      tags: ['3D CREATIVE', 'SOUNDSCAPES', 'DISCORD NEXO']
    },
    audio: {
      trackTitle: 'VYZEE • SOPHIE',
      audioSrc: 'background-music.mp3'
    },
    footer: {
      badge: 'AMMAR // NEXO ARCHIVE',
      sub: 'IMMERSIVE 3D GALAXY • SOUND-REACTIVE WEBGL ENGINE'
    },
    links: [
      {
        id: 'snapchat',
        platform: 'Snapchat',
        badge: 'رسمي',
        handle: '@xsopo24',
        url: 'https://www.snapchat.com/@xsopo24',
        accent: '#FFFC00'
      },
      {
        id: 'instagram',
        platform: 'Instagram',
        badge: 'يوميات',
        handle: '@hadjx.x',
        url: 'https://www.instagram.com/hadjx.x',
        accent: '#E1306C'
      },
      {
        id: 'tiktok',
        platform: 'TikTok',
        badge: 'مقاطع',
        handle: '@hadjx.x',
        url: 'https://www.tiktok.com/@hadjx.x',
        accent: '#00F2FE'
      },
      {
        id: 'discord',
        platform: 'Discord — NEXO',
        badge: 'مجتمعنا الخاص',
        handle: 'سيرفر NEXO الخاص بالأعضاء والمبدعين',
        url: 'https://discord.gg/dTA4e9GHG',
        accent: '#5865F2'
      },
      {
        id: 'bump',
        platform: 'Bump Maps',
        badge: 'الخريطة الحية',
        handle: 'الملف التفاعلي على Bump',
        url: 'https://bumpmaps.com/p/pJEKjUAYJoS2D',
        accent: '#38EF7D'
      },
      {
        id: 'linktree',
        platform: 'Linktree',
        badge: 'الدليل الشامل',
        handle: '@Hadjx',
        url: 'https://linktr.ee/Hadjx',
        accent: '#43E660'
      }
    ]
  };

  let currentSettings = loadSettings();
  let pendingAudioBase64 = null;  // holds base64 of file chosen but not yet applied
  let pendingAudioName = null;

  /* ---------------------------------------------------------------
     Settings Storage
  --------------------------------------------------------------- */
  function loadSettings() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not parse localStorage:', e);
    }
    return JSON.parse(JSON.stringify(defaultSettings));
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      showToast('✓ تم حفظ جميع التغييرات بنجاح وتحديث الموقع!');
    } catch (e) {
      alert('خطأ أثناء الحفظ: ' + e);
    }
  }

  /* ---------------------------------------------------------------
     Form Population
  --------------------------------------------------------------- */
  function populateForm() {
    document.getElementById('adm-name').value = currentSettings.profile.name || '';
    document.getElementById('adm-bio').value = currentSettings.profile.bio || '';
    document.getElementById('adm-avatar').value = currentSettings.profile.avatar || '';
    document.getElementById('avatar-preview-img').src = currentSettings.profile.avatar || 'assets/profile.jpg';
    document.getElementById('adm-tags').value = (currentSettings.profile.tags || []).join(', ');

    document.getElementById('adm-track-title').value = currentSettings.audio.trackTitle || '';
    document.getElementById('adm-audio-src').value = currentSettings.audio.audioSrc || '';
    document.getElementById('adm-footer-badge').value = currentSettings.footer.badge || '';
    document.getElementById('adm-footer-sub').value = currentSettings.footer.sub || '';

    renderLinksList();
    updateCurrentSongStatus();
  }

  /* ---------------------------------------------------------------
     Current Song Status Bar
  --------------------------------------------------------------- */
  function updateCurrentSongStatus() {
    const customName = localStorage.getItem(AUDIO_NAME_KEY);
    const songNameEl = document.getElementById('current-song-name');
    const removeBtn = document.getElementById('btn-remove-custom-song');

    if (customName) {
      songNameEl.textContent = customName;
      removeBtn.style.display = 'inline-flex';
    } else {
      songNameEl.textContent = currentSettings.audio.trackTitle || 'VYZEE • SOPHIE';
      removeBtn.style.display = 'none';
    }
  }

  /* ---------------------------------------------------------------
     Audio Upload — FileReader → Base64 → localStorage
  --------------------------------------------------------------- */
  const audioFileInput = document.getElementById('audio-file-input');
  const previewBar = document.getElementById('audio-preview-bar');
  const previewPlayer = document.getElementById('preview-audio-player');
  const uploadHint = document.getElementById('upload-hint-text');

  audioFileInput.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('audio/')) {
      showToast('⚠ الملف المحدد ليس ملف صوت صالح!');
      return;
    }

    const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
    uploadHint.textContent = `⏳ جاري تحميل "${file.name}" (${fileSizeMB} MB)...`;

    const reader = new FileReader();
    reader.onload = function (evt) {
      pendingAudioBase64 = evt.target.result; // data:audio/...;base64,...
      pendingAudioName = file.name.replace(/\.[^.]+$/, ''); // strip extension

      // Show preview player
      previewPlayer.src = pendingAudioBase64;
      previewBar.style.display = 'flex';

      uploadHint.textContent = `✓ "${file.name}" — جاهز للتطبيق`;
      showToast(`🎵 تم تحميل "${file.name}" — اضغط "تطبيق" لتفعيلها`);
    };

    reader.onerror = function () {
      showToast('⚠ فشل قراءة الملف. جرب ملفاً آخر.');
      uploadHint.textContent = 'اضغط لاختيار ملف موسيقي من هاتفك (MP3 / M4A / WAV)';
    };

    reader.readAsDataURL(file);
  });

  // Apply the pending song to the site
  document.getElementById('btn-apply-song').addEventListener('click', function () {
    if (!pendingAudioBase64) return;

    try {
      localStorage.setItem(AUDIO_BLOB_KEY, pendingAudioBase64);
      localStorage.setItem(AUDIO_NAME_KEY, pendingAudioName);

      // Also update track title field
      document.getElementById('adm-track-title').value = pendingAudioName;
      currentSettings.audio.trackTitle = pendingAudioName;
      saveSettings(currentSettings);

      // Reset UI
      previewBar.style.display = 'none';
      previewPlayer.src = '';
      pendingAudioBase64 = null;
      pendingAudioName = null;
      audioFileInput.value = '';
      uploadHint.textContent = 'اضغط لاختيار ملف موسيقي من هاتفك (MP3 / M4A / WAV)';

      updateCurrentSongStatus();
      showToast('✓ تم تطبيق الأغنية! افتح الموقع الرئيسي لسماعها 🎵');
    } catch (e) {
      // localStorage quota exceeded (large files)
      showToast('⚠ الملف كبير جداً لحفظه مؤقتاً (' + (pendingAudioBase64.length / 1024 / 1024).toFixed(1) + ' MB). جرب ملفاً أصغر.');
    }
  });

  // Cancel pending song
  document.getElementById('btn-cancel-song').addEventListener('click', function () {
    previewBar.style.display = 'none';
    previewPlayer.src = '';
    pendingAudioBase64 = null;
    pendingAudioName = null;
    audioFileInput.value = '';
    uploadHint.textContent = 'اضغط لاختيار ملف موسيقي من هاتفك (MP3 / M4A / WAV)';
    showToast('تم إلغاء تحميل الأغنية');
  });

  // Remove custom song, revert to default
  document.getElementById('btn-remove-custom-song').addEventListener('click', function () {
    if (confirm('هل تريد حذف الأغنية المخصصة والرجوع للأغنية الافتراضية؟')) {
      localStorage.removeItem(AUDIO_BLOB_KEY);
      localStorage.removeItem(AUDIO_NAME_KEY);
      updateCurrentSongStatus();
      showToast('✓ تمت استعادة الأغنية الافتراضية');
    }
  });

  /* ---------------------------------------------------------------
     Links Editor
  --------------------------------------------------------------- */
  function renderLinksList() {
    const list = document.getElementById('links-editor-list');
    list.innerHTML = '';

    currentSettings.links.forEach((link, idx) => {
      const row = document.createElement('div');
      row.className = 'link-item-row';
      row.innerHTML = `
        <input type="text" value="${escapeHtml(link.platform)}" placeholder="المنصة" data-idx="${idx}" data-field="platform">
        <input type="text" value="${escapeHtml(link.handle)}" placeholder="المعرف / النص" data-idx="${idx}" data-field="handle">
        <input type="url" value="${escapeHtml(link.url)}" placeholder="الرابط (URL)" data-idx="${idx}" data-field="url">
        <input type="text" value="${escapeHtml(link.badge || '')}" placeholder="الشارة (Badge)" data-idx="${idx}" data-field="badge">
        <button type="button" class="btn-icon-danger" title="حذف الرابط" data-del="${idx}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      `;
      list.appendChild(row);
    });

    // Attach link row change listeners
    list.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        const field = e.target.dataset.field;
        if (currentSettings.links[idx]) {
          currentSettings.links[idx][field] = e.target.value;
        }
      });
    });

    list.querySelectorAll('button[data-del]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.del, 10);
        if (confirm(`هل أنت متأكد من حذف الرابط "${currentSettings.links[idx].platform}"؟`)) {
          currentSettings.links.splice(idx, 1);
          renderLinksList();
        }
      });
    });
  }

  /* ---------------------------------------------------------------
     Utility
  --------------------------------------------------------------- */
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function showToast(msg) {
    const toast = document.getElementById('admin-toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2600);
  }

  /* ---------------------------------------------------------------
     Event Listeners — Profile & Settings
  --------------------------------------------------------------- */
  document.getElementById('adm-avatar').addEventListener('input', (e) => {
    document.getElementById('avatar-preview-img').src = e.target.value || 'assets/profile.jpg';
  });

  document.getElementById('btn-add-link').addEventListener('click', () => {
    currentSettings.links.push({
      id: 'custom-' + Date.now(),
      platform: 'منصة جديدة',
      badge: 'جديد',
      handle: '@username',
      url: 'https://',
      accent: '#00F2FE'
    });
    renderLinksList();
  });

  document.getElementById('btn-save-all').addEventListener('click', () => {
    currentSettings.profile.name = document.getElementById('adm-name').value.trim();
    currentSettings.profile.bio = document.getElementById('adm-bio').value.trim();
    currentSettings.profile.avatar = document.getElementById('adm-avatar').value.trim();
    currentSettings.profile.tags = document.getElementById('adm-tags').value.split(',').map(s => s.trim()).filter(Boolean);

    currentSettings.audio.trackTitle = document.getElementById('adm-track-title').value.trim();
    currentSettings.audio.audioSrc = document.getElementById('adm-audio-src').value.trim();
    currentSettings.footer.badge = document.getElementById('adm-footer-badge').value.trim();
    currentSettings.footer.sub = document.getElementById('adm-footer-sub').value.trim();

    saveSettings(currentSettings);
  });

  document.getElementById('btn-reset-defaults').addEventListener('click', () => {
    if (confirm('هل أنت متأكد من استعادة القيم الافتراضية؟ سيتم محو التغييرات غير المحفوظة.')) {
      localStorage.removeItem(STORAGE_KEY);
      currentSettings = JSON.parse(JSON.stringify(defaultSettings));
      populateForm();
      showToast('تمت استعادة الإعدادات الافتراضية');
    }
  });

  document.getElementById('btn-export-json').addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentSettings, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "ammar_hub_settings.json");
    dlAnchorElem.click();
  });

  /* ---------------------------------------------------------------
     Init
  --------------------------------------------------------------- */
  populateForm();
})();

