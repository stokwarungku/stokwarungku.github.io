/* Stok Warung - logika aplikasi (tanpa library, data di localStorage) */
(function () {
'use strict';

/* =====================================================================
   1. PENYIMPANAN
   ===================================================================== */
var KEYS = { real: 'sw3:data:real', demo: 'sw3:data:demo' };
var K_MODE = 'sw3:mode', K_SESS = 'sw3:sess';
var mem = {};
function lsGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; } }
function lsSet(k, v) { try { window.localStorage.setItem(k, v); return true; } catch (e) { mem[k] = v; return false; } }
function lsDel(k) { try { window.localStorage.removeItem(k); } catch (e) { } delete mem[k]; }
function ssGet(k) { try { return window.sessionStorage.getItem(k); } catch (e) { return mem['s:' + k] || null; } }
function ssSet(k, v) { try { if (v == null) window.sessionStorage.removeItem(k); else window.sessionStorage.setItem(k, v); } catch (e) { mem['s:' + k] = v; } }

var S = { mode: 'real', db: null, user: null, view: 'dashboard', cart: [], kmode: 'eceran', k: { pembeli: '', diskon: '', bayar: 0 },
  ver: 0, cache: {}, lap: null, stokMode: 'masuk', stokPre: null, trx: null, riw: null };

function D() { return S.db; }

/* =====================================================================
   2. HELPER UMUM
   ===================================================================== */
function $(s, r) { return (r || document).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
var nf = new Intl.NumberFormat('id-ID');
function fmt(n) { return nf.format(Math.round(n)); }
function rp(n) { return (n < 0 ? '-' : '') + 'Rp ' + nf.format(Math.abs(Math.round(n))); }
function pnum(s) { var t = String(s == null ? '' : s).replace(/[^\d]/g, ''); return t ? parseInt(t, 10) : 0; }
function sum(a, f) { var t = 0; a.forEach(function (x) { t += f(x); }); return t; }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function p2(n) { return n < 10 ? '0' + n : '' + n; }
function dkey(t) { var d = new Date(t); return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); }
function mkey(t) { return dkey(t).slice(0, 7); }
function startOf(k) { var a = k.split('-'); return new Date(+a[0], +a[1] - 1, +a[2], 0, 0, 0, 0).getTime(); }
function endOf(k) { var a = k.split('-'); return new Date(+a[0], +a[1] - 1, +a[2], 23, 59, 59, 999).getTime(); }
function fdt(t) { var d = new Date(t); return p2(d.getDate()) + '/' + p2(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes()); }
function fd(k) { var a = k.split('-'); return a[2] + '/' + a[1] + '/' + a[0]; }
var BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
function fbulan(mk) { var a = mk.split('-'); return BULAN[+a[1] - 1] + ' ' + a[0]; }
function addDays(k, n) { var a = k.split('-'); var d = new Date(+a[0], +a[1] - 1, +a[2] + n); return dkey(d.getTime()); }
function lastDayOfMonth(mk) { var a = mk.split('-'); return dkey(new Date(+a[0], +a[1], 0).getTime()); }
function today() { return dkey(Date.now()); }
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

/* terbilang rupiah */
var SATU = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
function tb(n) {
  n = Math.floor(n);
  if (n < 12) return SATU[n];
  if (n < 20) return tb(n - 10) + ' belas';
  if (n < 100) return tb(Math.floor(n / 10)) + ' puluh' + (n % 10 ? ' ' + tb(n % 10) : '');
  if (n < 200) return 'seratus' + (n > 100 ? ' ' + tb(n - 100) : '');
  if (n < 1000) return tb(Math.floor(n / 100)) + ' ratus' + (n % 100 ? ' ' + tb(n % 100) : '');
  if (n < 2000) return 'seribu' + (n > 1000 ? ' ' + tb(n - 1000) : '');
  if (n < 1e6) return tb(Math.floor(n / 1e3)) + ' ribu' + (n % 1e3 ? ' ' + tb(n % 1e3) : '');
  if (n < 1e9) return tb(Math.floor(n / 1e6)) + ' juta' + (n % 1e6 ? ' ' + tb(n % 1e6) : '');
  if (n < 1e12) return tb(Math.floor(n / 1e9)) + ' miliar' + (n % 1e9 ? ' ' + tb(n % 1e9) : '');
  return tb(Math.floor(n / 1e12)) + ' triliun' + (n % 1e12 ? ' ' + tb(n % 1e12) : '');
}
function terbilang(n) { return n > 0 ? cap(tb(n)) + ' rupiah' : ''; }

/* SHA-256 murni JavaScript (agar jalan juga di file:// tanpa secure context) */
var SK = [], SH = [];
(function () { var n = 2, c = 0; while (c < 64) { var pr = true; for (var i = 2; i * i <= n; i++) { if (n % i === 0) { pr = false; break; } } if (pr) { if (c < 8) SH[c] = (Math.pow(n, 0.5) % 1 * 4294967296) | 0; SK[c] = (Math.pow(n, 1 / 3) % 1 * 4294967296) | 0; c++; } n++; } })();
function sha256(s) {
  var m = unescape(encodeURIComponent(s)), l = m.length, w = [], i, j;
  for (i = 0; i < l; i++) w[i >> 2] |= m.charCodeAt(i) << (24 - (i % 4) * 8);
  w[l >> 2] |= 0x80 << (24 - (l % 4) * 8);
  w[(((l + 8) >> 6) + 1) * 16 - 1] = l * 8;
  var H = SH.slice();
  for (i = 0; i < w.length; i += 16) {
    var W = [], a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
    for (j = 0; j < 64; j++) {
      if (j < 16) W[j] = w[i + j] | 0;
      else {
        var g0 = W[j - 15], g1 = W[j - 2];
        var s0 = ((g0 >>> 7) | (g0 << 25)) ^ ((g0 >>> 18) | (g0 << 14)) ^ (g0 >>> 3);
        var s1 = ((g1 >>> 17) | (g1 << 15)) ^ ((g1 >>> 19) | (g1 << 13)) ^ (g1 >>> 10);
        W[j] = (W[j - 16] + s0 + W[j - 7] + s1) | 0;
      }
      var S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      var ch = (e & f) ^ (~e & g);
      var t1 = (h + S1 + ch + SK[j] + W[j]) | 0;
      var S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      var mj = (a & b) ^ (a & c) ^ (b & c);
      var t2 = (S0 + mj) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
  }
  return H.map(function (x) { return ('00000000' + (x >>> 0).toString(16)).slice(-8); }).join('');
}
function hashPw(pw, salt) { var h = salt + ':' + pw; for (var i = 0; i < 500; i++) h = sha256(h + salt); return h; }
function newSalt() { return uid() + uid(); }

var KODE_ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function newCode() {
  var out = '', arr = null, i;
  try { arr = new Uint8Array(12); window.crypto.getRandomValues(arr); } catch (e) { arr = null; }
  for (i = 0; i < 12; i++) { out += KODE_ABC.charAt((arr ? arr[i] : Math.floor(Math.random() * 256)) % KODE_ABC.length); if (i % 4 === 3 && i < 11) out += '-'; }
  return out;
}
function normCode(c) { return String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
function setRec(u, code) { var s = newSalt(); u.rec = { salt: s, hash: hashPw(normCode(code), s) }; }
function cekRec(u, code) { return !!(u && u.rec && hashPw(normCode(code), u.rec.salt) === u.rec.hash); }

/* =====================================================================
   3. UI KECIL: toast, modal, konfirmasi, flash tombol
   ===================================================================== */
function toast(msg, type) {
  var el = document.createElement('div');
  el.className = 'toast ' + (type || '');
  el.textContent = msg;
  $('#toasts').appendChild(el);
  setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, type === 'err' ? 4500 : 2800);
}
var flashTimers = new WeakMap();
function flash(btn, ok, text, ms) {
  if (!btn) return;
  if (btn.dataset.orig == null) btn.dataset.orig = btn.innerHTML;
  clearTimeout(flashTimers.get(btn));
  btn.classList.remove('ok', 'err');
  btn.classList.add(ok ? 'ok' : 'err');
  btn.innerHTML = text || (ok ? 'Berhasil ✓' : 'Gagal ✕');
  flashTimers.set(btn, setTimeout(function () {
    btn.classList.remove('ok', 'err');
    if (btn.dataset.orig != null) { btn.innerHTML = btn.dataset.orig; delete btn.dataset.orig; }
  }, ms || 1300));
}
var modalOnClose = null;
function openModal(html, wide) {
  var m = $('#modal');
  m.className = 'modal' + (wide ? ' wide' : '');
  m.innerHTML = html;
  $('#overlay').hidden = false;
  document.body.style.overflow = 'hidden';
  var f = m.querySelector('input:not([type=hidden]):not([type=checkbox]):not([type=radio]),select');
  if (f && window.innerWidth > 720) setTimeout(function () { if (m.contains(document.activeElement)) return; try { f.focus(); } catch (e) { } }, 30);
}
function closeModal() {
  $('#overlay').hidden = true;
  $('#modal').innerHTML = '';
  document.body.style.overflow = '';
  if (modalOnClose) { var f = modalOnClose; modalOnClose = null; f(); }
}
function confirmBox(o) {
  return new Promise(function (resolve) {
    var done = false;
    openModal('<h3>' + esc(o.judul || 'Konfirmasi') + '</h3><div>' + (o.html || esc(o.pesan || '')) + '</div>' +
      '<div class="mbtn"><button class="btn" type="button" data-cf="0">' + esc(o.batal || 'Batal') + '</button>' +
      '<button class="btn ' + (o.bahaya ? 'bad solid' : 'pri') + '" type="button" data-cf="1">' + esc(o.ya || 'Ya') + '</button></div>');
    modalOnClose = function () { if (!done) { done = true; resolve(false); } };
    $$('#modal [data-cf]').forEach(function (b) {
      b.onclick = function () { if (done) return; done = true; modalOnClose = null; closeModal(); resolve(b.getAttribute('data-cf') === '1'); };
    });
  });
}

/* input rupiah: pemisah ribuan + terbilang */
function pwField(id, label, ac) {
  return '<label class="fld"><span>' + label + '</span><div class="pw"><input id="' + id + '" type="password" autocomplete="' + ac + '"><button type="button" class="pw-eye" data-act="pw-eye" aria-label="Lihat atau sembunyikan password">Lihat</button></div></label>';
}
function showKode(code, nama) {
  openModal('<h3>Kode pemulihan</h3><p style="margin-top:0">Untuk akun <b>' + esc(nama) + '</b>. Kode ini dipakai di menu <b>Lupa password</b> jika password terlupa.</p>' +
    '<div class="kode" id="kodeBox">' + esc(code) + '</div><div class="hint warn"><b>Catat sekarang.</b> Kode hanya ditampilkan sekali dan tidak bisa dilihat lagi. Simpan di buku catatan atau foto di HP. Jika hilang, buat kode baru di Pengaturan.</div>' +
    '<div class="mbtn"><button class="btn" type="button" data-act="kode-salin" data-code="' + esc(code) + '">Salin kode</button><button class="btn pri" type="button" data-act="modal-close">Sudah saya simpan</button></div>');
}
function moneyField(id, label, val, hint) {
  return '<label class="fld"><span>' + label + '</span><div class="money-w"><i>Rp</i><input id="' + id + '" class="money" inputmode="numeric" autocomplete="off" value="' + (val ? fmt(val) : '') + '" placeholder="0"></div>' +
    '<small class="tb">' + (val ? terbilang(val) : '') + '</small>' + (hint ? '<small>' + hint + '</small>' : '') + '</label>';
}
function fmtMoneyEl(el) {
  var raw = el.value, pos = el.selectionStart == null ? raw.length : el.selectionStart;
  var before = raw.slice(0, pos).replace(/\D/g, '').length;
  var n = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  if (n.length > 13) n = n.slice(0, 13);
  var f = n ? nf.format(+n) : '';
  el.value = f;
  var i = 0, c = 0;
  if (before > 0) { for (i = 0; i < f.length; i++) { if (/\d/.test(f.charAt(i))) c++; if (c === before) { i++; break; } } }
  try { el.setSelectionRange(i, i); } catch (e) { }
  var t = el.closest('.fld'); t = t && t.querySelector('.tb');
  if (t) t.textContent = n ? terbilang(+n) : '';
}
function setMoney(el, n) { el.value = n ? fmt(n) : ''; var t = el.closest('.fld'); t = t && t.querySelector('.tb'); if (t) t.textContent = n ? terbilang(n) : ''; }
function getMoney(sel, root) { var e = $(sel, root); return e ? pnum(e.value) : 0; }

/* =====================================================================
   4. DATA: pembuatan, muat, simpan, validasi
   ===================================================================== */
function newDB(nama) {
  return { v: 1, toko: { nama: nama || 'Warung Saya', alamat: '', telp: '', footer: 'Terima kasih sudah berbelanja' },
    users: [], barang: [], gerak: [], nota: [], presets: { dus: 48, renceng: 10 }, lastBackup: 0, created: Date.now() };
}
function validDB(x) {
  return x && typeof x === 'object' && Array.isArray(x.users) && Array.isArray(x.barang) && Array.isArray(x.gerak) && Array.isArray(x.nota) && x.toko && typeof x.toko === 'object';
}
function normDB(x) {
  x.presets = x.presets || { dus: 48, renceng: 10 };
  x.lastBackup = x.lastBackup || 0;
  x.barang.forEach(function (b) { b.units = b.units || []; b.min = b.min || 0; b.modal = b.modal || 0; b.jualG = b.jualG || 0; });
  return x;
}
function loadMode(mode) {
  var raw = lsGet(KEYS[mode]);
  if (!raw) return null;
  try { var x = JSON.parse(raw); return validDB(x) ? normDB(x) : null; } catch (e) { return null; }
}
function save() {
  S.ver++;
  var ok = lsSet(KEYS[S.mode], JSON.stringify(S.db));
  if (!ok) toast('Penyimpanan browser tidak tersedia. Data hilang saat halaman ditutup!', 'err');
  return ok;
}
function setDB(db) { S.db = db; S.ver++; }

function stok() {
  if (S.cache.ver === S.ver && S.cache.st) return S.cache.st;
  var m = {};
  D().barang.forEach(function (b) { m[b.id] = { masuk: 0, keluar: 0, sisa: 0 }; });
  D().gerak.forEach(function (g) { var x = m[g.barangId]; if (!x) return; if (g.jenis === 'masuk') x.masuk += g.qty; else x.keluar += g.qty; });
  Object.keys(m).forEach(function (k) { m[k].sisa = m[k].masuk - m[k].keluar; });
  S.cache = { ver: S.ver, st: m };
  return m;
}
function barangById(id) { return D().barang.filter(function (b) { return b.id === id; })[0]; }
function unitsOf(b) { var u = [{ nama: b.satuan, isi: 1 }]; (b.units || []).forEach(function (x) { u.push({ nama: x.nama, isi: x.isi }); }); return u; }
function unitsDesc(b) { return unitsOf(b).sort(function (a, c) { return c.isi - a.isi; }); }
function isiOf(b, nama) { var u = unitsOf(b).filter(function (x) { return x.nama === nama; })[0]; return u ? u.isi : 1; }
function breakdown(b, q) {
  var r = Math.abs(q), out = [];
  unitsDesc(b).forEach(function (u) { var n = Math.floor(r / u.isi); if (n > 0) { out.push(fmt(n) + ' ' + u.nama); r -= n * u.isi; } });
  return out.length ? out.join(' + ') : '0 ' + b.satuan;
}
function qtyHTML(b, q) {
  var h = '<b>' + fmt(q) + '</b> ' + esc(b.satuan);
  if ((b.units || []).length && Math.abs(q) >= Math.min.apply(null, b.units.map(function (u) { return u.isi; }))) h += '<br><small>' + esc(breakdown(b, q)) + '</small>';
  return h;
}
function statusStok(b, sisa) { return sisa <= 0 ? 'habis' : (sisa <= b.min ? 'menipis' : 'aman'); }
function statusBadge(s) { return s === 'habis' ? '<span class="badge bad">Habis</span>' : (s === 'menipis' ? '<span class="badge warn">Menipis</span>' : '<span class="badge ok">Aman</span>'); }
function hargaJual(b, mode) { return mode === 'grosir' ? (b.jualG || b.jual) : b.jual; }

/* ---------- transaksi penjualan ---------- */
function alokDiskon(n) {
  var res = [], used = 0;
  n.items.forEach(function (it, i) {
    var a = (i === n.items.length - 1) ? (n.diskon - used) : (n.subtotal ? Math.round(n.diskon * it.sub / n.subtotal) : 0);
    used += a; res.push(a);
  });
  return res;
}
function buatNota(lines, o) {
  var d = D(), st = stok(), need = {}, items = [], subtotal = 0, i;
  if (!lines.length) return { err: 'Keranjang masih kosong.' };
  for (i = 0; i < lines.length; i++) {
    var l = lines[i], b = barangById(l.barangId);
    if (!b || b.arsip) return { err: 'Barang tidak ditemukan atau sudah diarsipkan.' };
    if (!(l.jumlah > 0) || Math.floor(l.jumlah) !== l.jumlah) return { err: 'Jumlah ' + b.nama + ' harus bilangan bulat lebih dari 0.' };
    var isi = isiOf(b, l.unit), qty = l.jumlah * isi;
    need[b.id] = (need[b.id] || 0) + qty;
    var harga = isi * hargaJual(b, o.mode), sub = harga * l.jumlah;
    items.push({ barangId: b.id, nama: b.nama, unit: l.unit, jumlah: l.jumlah, isi: isi, qty: qty, harga: harga, modal: b.modal, sub: sub, satuan: b.satuan });
    subtotal += sub;
  }
  for (var id in need) {
    if (need[id] > st[id].sisa) { var bb = barangById(id); return { err: 'Stok ' + bb.nama + ' tidak cukup (sisa ' + fmt(st[id].sisa) + ' ' + bb.satuan + ', diminta ' + fmt(need[id]) + ').' }; }
  }
  var diskonP = o.mode === 'grosir' ? Math.min(100, Math.max(0, o.diskonP || 0)) : 0;
  var diskon = Math.round(subtotal * diskonP / 100), total = subtotal - diskon;
  if (!(o.bayar >= total)) return { err: 'Uang bayar kurang ' + rp(total - o.bayar) + '.' };
  var t = o.t || Date.now(), key = dkey(t).replace(/-/g, '');
  var n = d.nota.filter(function (x) { return dkey(x.t) === dkey(t); }).length + 1;
  var nota = { id: uid(), no: 'NT' + key + '-' + ('00' + n).slice(-3), t: t, kasir: o.kasir, kasirId: o.kasirId, mode: o.mode, pembeli: o.mode === 'grosir' ? (o.pembeli || '') : '',
    items: items, subtotal: subtotal, diskonP: diskonP, diskon: diskon, total: total, bayar: o.bayar, kembali: o.bayar - total, batal: false };
  d.nota.push(nota);
  items.forEach(function (it) {
    d.gerak.push({ id: uid(), t: t, barangId: it.barangId, jenis: 'keluar', qty: it.qty, alasan: 'Penjualan', ket: nota.no, harga: it.modal, user: o.kasir, ref: nota.id });
  });
  S.cache = {};
  return { nota: nota };
}
function batalNota(n, alasan) {
  n.batal = true; n.tBatal = Date.now(); n.alasanBatal = alasan || ''; n.olehBatal = S.user.nama;
  n.items.forEach(function (it) {
    D().gerak.push({ id: uid(), t: Date.now(), barangId: it.barangId, jenis: 'masuk', qty: it.qty, alasan: 'Pembatalan nota', ket: n.no, harga: it.modal, user: S.user.nama, ref: n.id });
  });
}

/* ---------- laporan ---------- */
function calc(from, to) {
  var d = D(), r = { notas: [], pemasukan: 0, subtotal: 0, diskon: 0, hpp: 0, laba: 0, terjual: 0, pembelian: 0, trx: 0, items: {}, days: {} };
  function day(k) { return r.days[k] || (r.days[k] = { trx: 0, pemasukan: 0, hpp: 0, pembelian: 0 }); }
  d.nota.forEach(function (n) {
    if (n.batal || n.t < from || n.t > to) return;
    r.trx++; r.notas.push(n); r.pemasukan += n.total; r.subtotal += n.subtotal; r.diskon += n.diskon;
    var al = alokDiskon(n), dy = day(dkey(n.t));
    dy.trx++; dy.pemasukan += n.total;
    n.items.forEach(function (it, i) {
      var h = it.qty * it.modal;
      r.hpp += h; dy.hpp += h; r.terjual += it.qty;
      var x = r.items[it.barangId] || (r.items[it.barangId] = { id: it.barangId, nama: it.nama, satuan: it.satuan, qty: 0, pendapatan: 0, hpp: 0 });
      x.qty += it.qty; x.pendapatan += it.sub - al[i]; x.hpp += h;
    });
  });
  d.gerak.forEach(function (g) {
    if (g.jenis === 'masuk' && g.alasan === 'Pembelian' && g.t >= from && g.t <= to) {
      var v = g.qty * g.harga; r.pembelian += v; day(dkey(g.t)).pembelian += v;
    }
  });
  r.laba = r.pemasukan - r.hpp;
  r.terlaris = Object.keys(r.items).map(function (k) { return r.items[k]; }).sort(function (a, b) { return b.qty - a.qty || b.pendapatan - a.pendapatan; });
  return r;
}

/* =====================================================================
   5. DATA DEMO (terpisah total dari data asli)
   ===================================================================== */
function seedDemo() {
  var db = newDB('Warung Demo Berkah');
  db.toko.alamat = 'Jl. Contoh No. 12, Jakarta'; db.toko.telp = '0812-0000-0000';
  db.users = [
    { id: uid(), nama: 'Bu Sari', username: 'pemilik', role: 'pemilik', aktif: true },
    { id: uid(), nama: 'Andi', username: 'kasir', role: 'kasir', aktif: true }
  ];
  [['pemilik123', 0], ['kasir123', 1]].forEach(function (p) { var u = db.users[p[1]]; u.salt = newSalt(); u.hash = hashPw(p[0], u.salt); setRec(u, 'DEMO-0000-0000'); });
  var B = [
    ['Indomie Goreng', 'pcs', [['dus', 48]], 2800, 3500, 3200, 48, 10],
    ['Kopi Kapal Api Sachet', 'sachet', [['renceng', 10]], 1200, 1500, 1350, 30, 30],
    ['Aqua 600ml', 'botol', [['dus', 24]], 2400, 3500, 3000, 24, 8],
    ['Teh Pucuk 350ml', 'botol', [['dus', 24]], 3200, 4500, 4000, 24, 5],
    ['Gula Pasir', 'kg', [['karung', 50]], 14000, 16000, 15000, 10, 2],
    ['Minyak Goreng 1L', 'pcs', [['dus', 12]], 16500, 19000, 18000, 12, 5],
    ['Roti Tawar', 'pcs', [], 12000, 15000, 0, 5, 20],
    ['Telur Ayam', 'butir', [['tray', 30]], 2100, 2500, 2300, 30, 10],
    ['Sabun Mandi', 'pcs', [['dus', 36]], 2500, 3500, 3000, 12, 3]
  ];
  var t0 = Date.now() - 13 * 86400000;
  B.forEach(function (x) {
    var b = { id: uid(), nama: x[0], satuan: x[1], units: x[2].map(function (u) { return { nama: u[0], isi: u[1] }; }), modal: x[3], jual: x[4], jualG: x[5], min: x[6], arsip: false };
    db.barang.push(b);
    var awal = b.units.length ? b.units[0].isi * x[7] : x[7] * 4;
    if (b.nama === 'Roti Tawar') awal = 40;
    db.gerak.push({ id: uid(), t: t0, barangId: b.id, jenis: 'masuk', qty: Math.round(awal * 0.5), alasan: 'Stok awal', ket: '', harga: b.modal, user: 'Bu Sari' });
    db.gerak.push({ id: uid(), t: t0 + 3600000, barangId: b.id, jenis: 'masuk', qty: Math.round(awal * 1.5), alasan: 'Pembelian', ket: 'Grosir Sumber Rejeki', harga: b.modal, user: 'Bu Sari' });
  });
  var seed = 20261121;
  function rnd() { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
  var saveDB = S.db, saveMode = S.mode, saveVer = S.ver, saveCache = S.cache;
  S.db = db; S.ver++; S.cache = {};
  for (var off = 12; off >= 0; off--) {
    var ntr = 3 + Math.floor(rnd() * 5);
    for (var k = 0; k < ntr; k++) {
      var grosir = rnd() < 0.18, nl = 1 + Math.floor(rnd() * 3), lines = [];
      var base = startOf(dkey(Date.now() - off * 86400000)) + (8 + Math.floor(rnd() * 11)) * 3600000 + Math.floor(rnd() * 59) * 60000;
      if (off === 0) base = Math.max(startOf(today()) + 3600000, Date.now() - (5 + Math.floor(rnd() * 240)) * 60000);
      for (var j = 0; j < nl; j++) {
        var b = db.barang[Math.floor(rnd() * db.barang.length)];
        var useU = grosir && b.units.length ? b.units[0] : null;
        lines.push({ barangId: b.id, unit: useU ? useU.nama : b.satuan, jumlah: useU ? 1 + Math.floor(rnd() * 2) : 1 + Math.floor(rnd() * 5) });
      }
      var seen = {}; lines = lines.filter(function (l) { var kk = l.barangId + l.unit; if (seen[kk]) return false; seen[kk] = 1; return true; });
      var res = buatNota(lines, { mode: grosir ? 'grosir' : 'eceran', pembeli: grosir ? ['Toko Maju', 'Warung Bu Tini', 'Kantin SMP 3'][Math.floor(rnd() * 3)] : '', diskonP: grosir ? [0, 2, 5][Math.floor(rnd() * 3)] : 0, bayar: 99999999, t: base, kasir: 'Andi', kasirId: db.users[1].id });
      if (res.nota) res.nota.kembali = 0, res.nota.bayar = res.nota.total;
    }
  }
  var rb = db.barang[6], tp = db.barang[3];
  db.gerak.push({ id: uid(), t: Date.now() - 86400000, barangId: rb.id, jenis: 'keluar', qty: 6, alasan: 'Kadaluarsa', ket: '', harga: rb.modal, user: 'Bu Sari' });
  S.cache = {};
  var stt = stok();
  var kur = stt[tp.id].sisa - 7; if (kur > 0) db.gerak.push({ id: uid(), t: Date.now() - 3600000, barangId: tp.id, jenis: 'keluar', qty: kur, alasan: 'Dipakai sendiri', ket: 'Acara keluarga', harga: tp.modal, user: 'Bu Sari' });
  S.db = saveDB; S.mode = saveMode; S.ver = saveVer + 1; S.cache = {};
  return db;
}

/* =====================================================================
   6. LOGIN / SETUP / MODE
   ===================================================================== */
function setMode(m) { S.mode = m; lsSet(K_MODE, m); }
function initData() {
  var m = lsGet(K_MODE); S.mode = m === 'demo' ? 'demo' : 'real';
  var db = loadMode(S.mode);
  if (!db && S.mode === 'demo') { db = seedDemo(); }
  setDB(db);
  if (S.mode === 'demo' && !lsGet(KEYS.demo)) save();
}
function restoreSession() {
  S.user = null;
  var raw = ssGet(K_SESS); if (!raw || !D()) return;
  try { var s = JSON.parse(raw); if (s.mode !== S.mode) return; var u = D().users.filter(function (x) { return x.id === s.id && x.aktif; })[0]; if (u) S.user = u; } catch (e) { }
}
function showAuth(msg) {
  $('#app').hidden = true; $('#auth').hidden = false;
  var demo = S.mode === 'demo', card = $('#authCard');
  var foot = '<div class="auth-foot">' +
    (demo ? '<button class="btn link" type="button" data-act="mode-real">&larr; Kembali ke data asli toko</button>'
      : '<button class="btn link" type="button" data-act="mode-demo">Coba mode demo (data contoh)</button>') + '</div>';
  var links = '<div class="auth-links"><button class="btn link" type="button" data-act="lupa">Lupa password?</button><button class="btn link" type="button" data-act="pulih-akun">Pulihkan akun</button></div>';
  if (!D() || !D().users.length) {
    card.innerHTML = '<h2>Selamat datang</h2><p class="mut">Buat akun pemilik untuk mulai memakai Stok Warung.</p>' +
      '<form data-form="setup" novalidate>' +
      '<label class="fld"><span>Nama toko</span><input id="sToko" placeholder="Contoh: Warung Bu Sari" autocomplete="off"></label>' +
      '<label class="fld"><span>Nama pemilik</span><input id="sNama" autocomplete="off"></label>' +
      '<label class="fld"><span>Username</span><input id="sUser" autocomplete="username" autocapitalize="none"></label>' +
      '<label class="fld"><span>Password (minimal 6 karakter)</span><div class="pw"><input id="sPass" type="password" autocomplete="new-password"><button type="button" class="pw-eye" data-act="pw-eye" aria-label="Lihat atau sembunyikan password">Lihat</button></div></label>' +
      '<label class="fld"><span>Ulangi password</span><div class="pw"><input id="sPass2" type="password" autocomplete="new-password"><button type="button" class="pw-eye" data-act="pw-eye" aria-label="Lihat atau sembunyikan password">Lihat</button></div></label>' +
      '<div class="msg err" id="authMsg"></div><button class="btn pri lg" type="submit" id="authBtn">Buat akun &amp; mulai</button></form><div class="auth-links"><button class="btn link" type="button" data-act="pulih-akun">Sudah punya backup? Pulihkan akun</button></div>' + foot;
  } else {
    card.innerHTML = '<h2>Masuk</h2><p class="mut">' + esc(D().toko.nama) + '</p>' +
      (demo ? '<div class="hint">Mode demo. Pemilik: <b>pemilik</b> / <b>pemilik123</b><br>Kasir: <b>kasir</b> / <b>kasir123</b><br>Kode pemulihan demo: <b>DEMO-0000-0000</b></div>' : '') +
      '<form data-form="login" novalidate>' +
      '<label class="fld"><span>Username</span><input id="lUser" autocomplete="username" autocapitalize="none"></label>' +
      '<label class="fld"><span>Password</span><div class="pw"><input id="lPass" type="password" autocomplete="current-password"><button type="button" class="pw-eye" data-act="pw-eye" aria-label="Lihat atau sembunyikan password">Lihat</button></div></label>' +
      '<div class="msg err" id="authMsg">' + esc(msg || '') + '</div><button class="btn pri lg" type="submit" id="authBtn">Masuk</button></form>' + links + foot;
  }
}
function doLogin(btn) {
  var u = $('#lUser').value.trim().toLowerCase(), p = $('#lPass').value;
  var us = D().users.filter(function (x) { return x.username.toLowerCase() === u; })[0];
  var ok = us && us.aktif && hashPw(p, us.salt) === us.hash;
  if (!ok) { $('#authMsg').textContent = us && !us.aktif ? 'Akun ini dinonaktifkan. Hubungi pemilik.' : 'Username atau password salah.'; flash(btn, false, 'Gagal ✕'); return; }
  S.user = us; ssSet(K_SESS, JSON.stringify({ mode: S.mode, id: us.id }));
  flash(btn, true, 'Berhasil ✓', 500);
  setTimeout(function () { enterApp(); }, 250);
}
function doSetup(btn) {
  var toko = $('#sToko').value.trim(), nama = $('#sNama').value.trim(), user = $('#sUser').value.trim().toLowerCase(), p = $('#sPass').value, p2v = $('#sPass2').value;
  var err = !toko ? 'Nama toko wajib diisi.' : !nama ? 'Nama pemilik wajib diisi.' : !/^[a-z0-9._-]{3,}$/.test(user) ? 'Username minimal 3 karakter (huruf, angka, titik, strip).' : p.length < 6 ? 'Password minimal 6 karakter.' : p !== p2v ? 'Ulangi password tidak sama.' : '';
  if (err) { $('#authMsg').textContent = err; flash(btn, false); return; }
  var db = newDB(toko); var salt = newSalt();
  db.users.push({ id: uid(), nama: nama, username: user, role: 'pemilik', aktif: true, salt: salt, hash: hashPw(p, salt) });
  var kode = newCode(); setRec(db.users[0], kode);
  setDB(db); save();
  S.user = db.users[0]; ssSet(K_SESS, JSON.stringify({ mode: S.mode, id: S.user.id }));
  flash(btn, true, 'Berhasil ✓', 500);
  setTimeout(function () { enterApp(); toast('Akun pemilik dibuat. Mulai dengan menambah barang.', 'ok'); showKode(kode, nama); }, 250);
}
var lupaFail = 0, lupaUntil = 0;
function doLupa(btn) {
  var m = $('#fMsg'), now = Date.now();
  if (now < lupaUntil) { m.textContent = 'Terlalu banyak percobaan. Coba lagi ' + Math.ceil((lupaUntil - now) / 1000) + ' detik lagi.'; flash(btn, false); return; }
  var un = $('#fUser').value.trim().toLowerCase(), kode = $('#fKode').value, p1 = $('#fBaru').value, p2v = $('#fBaru2').value;
  var u = D() && D().users.filter(function (x) { return x.username.toLowerCase() === un && x.aktif; })[0];
  var err = !un || !normCode(kode) ? 'Isi username dan kode pemulihan.' : p1.length < 6 ? 'Password baru minimal 6 karakter.' : p1 !== p2v ? 'Ulangi password baru tidak sama.' : '';
  if (!err && !cekRec(u, kode)) {
    lupaFail++; if (lupaFail >= 5) { lupaUntil = now + 60000; lupaFail = 0; }
    err = 'Username atau kode pemulihan salah.';
  }
  if (err) { m.textContent = err; flash(btn, false); return; }
  lupaFail = 0;
  u.salt = newSalt(); u.hash = hashPw(p1, u.salt);
  var kodeBaru = newCode(); setRec(u, kodeBaru); save();
  btn.disabled = true; flash(btn, true, 'Berhasil \u2713', 700);
  setTimeout(function () { closeModal(); showAuth(); toast('Password diganti. Silakan masuk. Catat kode pemulihan baru.', 'ok'); setTimeout(function () { showKode(kodeBaru, u.nama); }, 50); }, 650);
}
function doKode(btn) {
  var m = $('#kMsg2');
  if (hashPw($('#kPw').value, S.user.salt) !== S.user.hash) { m.textContent = 'Password salah.'; flash(btn, false); return; }
  var kode = newCode(); setRec(S.user, kode); save();
  btn.disabled = true; flash(btn, true, 'Berhasil \u2713', 500);
  setTimeout(function () { closeModal(); showKode(kode, S.user.nama); if (S.view === 'pengaturan') render(false); }, 450);
}
function doHapusAkun(f, btn) {
  var m = $('#hMsg'), last = f.getAttribute('data-last') === '1';
  if (hashPw($('#hPw').value, S.user.salt) !== S.user.hash) { m.textContent = 'Password salah.'; flash(btn, false); return; }
  if (last && $('#hKonf').value.trim() !== 'HAPUS') { m.textContent = 'Ketik HAPUS (huruf besar) untuk konfirmasi.'; flash(btn, false); return; }
  btn.disabled = true; flash(btn, true, 'Terhapus \u2713', 600);
  var id = S.user.id;
  setTimeout(function () {
    closeModal();
    if (last) { lsDel(KEYS.real); setDB(null); S.user = null; ssSet(K_SESS, null); S.cart = []; showAuth(); toast('Akun dan semua data toko dihapus. Buat akun baru untuk mulai lagi.', 'ok'); }
    else { D().users = D().users.filter(function (x) { return x.id !== id; }); save(); logout(); toast('Akun dihapus.', 'ok'); }
  }, 600);
}
function logout() {
  S.user = null; S.cart = []; S.k = { pembeli: '', diskon: '', bayar: 0 }; ssSet(K_SESS, null);
  closeModal(); showAuth();
}
function switchMode(m) {
  if (S.user) { S.user = null; ssSet(K_SESS, null); }
  S.cart = []; S.k = { pembeli: '', diskon: '', bayar: 0 };
  setMode(m);
  var db = loadMode(m);
  if (!db && m === 'demo') { db = seedDemo(); setDB(db); save(); } else setDB(db);
  showAuth();
}
function enterApp() {
  $('#auth').hidden = true; $('#app').hidden = false;
  var h = (location.hash || '').replace('#', '');
  S.view = NAVOK(h) ? h : 'dashboard';
  if (location.hash !== '#' + S.view) { try { history.replaceState(null, '', '#' + S.view); } catch (e) { location.hash = S.view; } }
  render(true);
}

/* =====================================================================
   7. NAVIGASI & RENDER
   ===================================================================== */
var NAV = [
  { id: 'dashboard', t: 'Dashboard', r: ['pemilik', 'kasir'] },
  { id: 'kasir', t: 'Kasir', r: ['pemilik', 'kasir'] },
  { id: 'barang', t: 'Barang', r: ['pemilik', 'kasir'] },
  { id: 'stok', t: 'Stok', r: ['pemilik'] },
  { id: 'transaksi', t: 'Transaksi', r: ['pemilik', 'kasir'] },
  { id: 'laporan', t: 'Laporan', r: ['pemilik'] },
  { id: 'pengguna', t: 'Pengguna', r: ['pemilik'] },
  { id: 'pengaturan', t: 'Pengaturan', r: ['pemilik', 'kasir'] }
];
function NAVOK(id) { return !!S.user && NAV.some(function (n) { return n.id === id && n.r.indexOf(S.user.role) >= 0; }); }
function isOwner() { return S.user && S.user.role === 'pemilik'; }

function renderHeader() {
  $('#brandName').textContent = D().toko.nama || 'Stok Warung';
  document.title = (D().toko.nama || 'Stok Warung') + ' - Stok Warung';
  $('#nav').innerHTML = NAV.filter(function (n) { return n.r.indexOf(S.user.role) >= 0; }).map(function (n) {
    return '<a href="#' + n.id + '" data-act="go" class="' + (n.id === S.view ? 'on' : '') + '">' + n.t + '</a>';
  }).join('');
  $('#whoChip').textContent = S.user.nama + ' · ' + (S.user.role === 'pemilik' ? 'Pemilik' : 'Kasir');
  $('#demoBar').hidden = S.mode !== 'demo';
  $('#nav').classList.remove('open');
}
var VIEWS = {};
function render(resetScroll) {
  if (!S.user) { showAuth(); return; }
  if (!NAVOK(S.view)) S.view = 'dashboard';
  renderHeader();
  var v = VIEWS[S.view];
  $('#view').innerHTML = v.html();
  if (v.after) v.after();
  if (resetScroll) window.scrollTo(0, 0);
}
function refresh() { var y = window.scrollY; render(false); window.scrollTo(0, y); }
window.addEventListener('hashchange', function () {
  if (!S.user) return;
  var h = location.hash.replace('#', '');
  if (NAVOK(h)) { S.view = h; render(true); }
});

/* =====================================================================
   8. DASHBOARD
   ===================================================================== */
function miniBars(days) {
  var max = Math.max.apply(null, days.map(function (x) { return x.v; }).concat([1]));
  return '<div class="bars">' + days.map(function (x) {
    return '<div class="bar" title="' + esc(x.t + ': ' + rp(x.v)) + '"><b>' + (x.v ? (x.v >= 1000 ? Math.round(x.v / 1000) + 'rb' : x.v) : '') + '</b><i style="height:' + Math.max(1, Math.round(x.v / max * 100)) + '%"></i><span>' + esc(x.l) + '</span></div>';
  }).join('') + '</div>';
}
VIEWS.dashboard = {
  html: function () {
    var d = D(), st = stok(), tk = today();
    var r = calc(startOf(tk), endOf(tk));
    var aktif = d.barang.filter(function (b) { return !b.arsip; });
    var low = aktif.filter(function (b) { return statusStok(b, st[b.id].sisa) !== 'aman'; }).sort(function (a, b) { return st[a.id].sisa - st[b.id].sisa; });
    var habis = low.filter(function (b) { return st[b.id].sisa <= 0; }).length;
    var owner = isOwner();
    var h = '<div class="ph"><h1>Dashboard</h1><div class="acts"><a class="btn pri" href="#kasir">Buka Kasir</a>' + (owner ? '<a class="btn" href="#stok">Stok</a>' : '') + '</div></div>';
    if (owner && (!d.lastBackup || Date.now() - d.lastBackup > 7 * 86400000) && (d.nota.length || d.barang.length)) {
      h += '<div class="hint warn"><b>Ingat backup.</b> ' + (d.lastBackup ? 'Backup terakhir ' + fdt(d.lastBackup) + '.' : 'Data belum pernah di-backup.') + ' <button class="btn sm" data-act="backup" type="button">Backup sekarang</button></div>';
    }
    h += '<div class="cards">' +
      '<div class="stat"><div class="l">Penjualan hari ini</div><div class="v">' + rp(r.pemasukan) + '</div><div class="s">' + r.trx + ' transaksi</div></div>';
    if (owner) h += '<div class="stat ok"><div class="l">Keuntungan kotor hari ini</div><div class="v">' + rp(r.laba) + '</div><div class="s">Penjualan dikurangi harga modal</div></div>';
    h += '<div class="stat"><div class="l">Jenis barang</div><div class="v">' + aktif.length + '</div><div class="s">' + (owner ? 'Nilai stok (modal): ' + rp(sum(aktif, function (b) { return Math.max(0, st[b.id].sisa) * b.modal; })) : 'barang aktif') + '</div></div>' +
      '<div class="stat ' + (low.length ? 'warn' : 'ok') + '"><div class="l">Stok menipis / habis</div><div class="v">' + low.length + '</div><div class="s">' + habis + ' barang habis</div></div></div>';
    h += '<div class="grid2"><div class="card"><h2>Peringatan stok minimum</h2>';
    if (!low.length) h += '<div class="empty">Semua stok aman.</div>';
    else h += '<div class="tw"><table class="rt"><thead><tr><th>Barang</th><th class="r">Sisa</th><th class="r">Minimum</th><th></th></tr></thead><tbody>' + low.slice(0, 12).map(function (b) {
      var s = st[b.id].sisa;
      return '<tr class="' + (s <= 0 ? 'out' : 'low') + '"><td data-l="Barang"><b>' + esc(b.nama) + '</b></td><td class="r" data-l="Sisa">' + fmt(s) + ' ' + esc(b.satuan) + ' ' + statusBadge(statusStok(b, s)) + '</td><td class="r" data-l="Minimum">' + fmt(b.min) + '</td><td class="acts-c">' + (owner ? '<button class="btn sm pri" data-act="stok-cepat" data-id="' + b.id + '" type="button">+ Stok</button>' : '') + '</td></tr>';
    }).join('') + '</tbody></table></div>' + (low.length > 12 ? '<small>dan ' + (low.length - 12) + ' barang lain.</small>' : '');
    h += '</div><div class="card"><h2>Transaksi terbaru</h2>';
    var recent = d.nota.slice().sort(function (a, b) { return b.t - a.t; }).filter(function (n) { return owner || n.kasirId === S.user.id; }).slice(0, 6);
    if (!recent.length) h += '<div class="empty">Belum ada transaksi.</div>';
    else h += '<div class="tw"><table class="rt"><thead><tr><th>No. nota</th><th>Waktu</th><th class="r">Total</th></tr></thead><tbody>' + recent.map(function (n) {
      return '<tr><td data-l="Nota"><a href="#" data-act="nota-lihat" data-id="' + n.id + '">' + esc(n.no) + '</a> ' + (n.mode === 'grosir' ? '<span class="badge pri">Grosir</span>' : '') + (n.batal ? ' <span class="badge bad">Batal</span>' : '') + '</td><td data-l="Waktu">' + fdt(n.t) + '</td><td class="r" data-l="Total">' + rp(n.total) + '</td></tr>';
    }).join('') + '</tbody></table></div>';
    h += '</div></div>';
    if (owner) {
      var days = [];
      for (var i = 6; i >= 0; i--) { var k = addDays(tk, -i), rr = calc(startOf(k), endOf(k)); days.push({ l: k.slice(8), t: fd(k), v: rr.pemasukan }); }
      var bln = calc(startOf(tk.slice(0, 7) + '-01'), endOf(tk));
      h += '<div class="grid2" style="margin-top:1em"><div class="card"><h2>Penjualan 7 hari terakhir</h2>' + miniBars(days) + '</div>' +
        '<div class="card"><h2>Barang terlaris bulan ini</h2>' + (bln.terlaris.length ? '<div class="tw"><table class="rt"><thead><tr><th>Barang</th><th class="r">Terjual</th><th class="r">Pendapatan</th></tr></thead><tbody>' + bln.terlaris.slice(0, 5).map(function (x) {
          var b = barangById(x.id);
          return '<tr><td data-l="Barang">' + esc(x.nama) + '</td><td class="r" data-l="Terjual">' + (b ? esc(breakdown(b, x.qty)) : fmt(x.qty) + ' ' + esc(x.satuan)) + '</td><td class="r" data-l="Pendapatan">' + rp(x.pendapatan) + '</td></tr>';
        }).join('') + '</tbody></table></div>' : '<div class="empty">Belum ada penjualan bulan ini.</div>') + '</div></div>';
    }
    return h;
  }
};

/* =====================================================================
   9. BARANG
   ===================================================================== */
var barangUI = { q: '', f: 'semua', arsip: false };
VIEWS.barang = {
  html: function () {
    var owner = isOwner();
    return '<div class="ph"><h1>Data Barang</h1><div class="acts">' + (owner ? '<button class="btn pri" data-act="barang-tambah" type="button">+ Tambah Barang</button>' : '') + '</div></div>' +
      '<div class="card"><div class="tools"><input id="bSearch" class="inp" placeholder="Cari nama barang…" value="' + esc(barangUI.q) + '" autocomplete="off">' +
      '<select id="bFilter" class="inp"><option value="semua">Semua stok</option><option value="menipis">Menipis / habis</option><option value="habis">Habis saja</option></select>' +
      (owner ? '<label class="chk" style="margin:0"><input type="checkbox" id="bArsip"' + (barangUI.arsip ? ' checked' : '') + '> Tampilkan arsip</label>' : '') + '</div>' +
      '<div class="tw"><table class="rt"><thead><tr><th>Nama barang</th><th>Satuan</th><th class="r">Stok</th><th class="r">Minimum</th>' + (owner ? '<th class="r">Harga modal</th>' : '') + '<th class="r">Harga jual</th><th class="r">Harga grosir</th><th>Status</th>' + (owner ? '<th>Aksi</th>' : '') + '</tr></thead><tbody id="bList"></tbody></table></div></div>';
  },
  after: function () { $('#bFilter').value = barangUI.f; renderBarangRows(); }
};
function renderBarangRows() {
  var d = D(), st = stok(), owner = isOwner(), q = barangUI.q.trim().toLowerCase();
  var rows = d.barang.filter(function (b) {
    if (b.arsip && !(owner && barangUI.arsip)) return false;
    if (q && b.nama.toLowerCase().indexOf(q) < 0) return false;
    var s = statusStok(b, st[b.id].sisa);
    if (barangUI.f === 'menipis' && s === 'aman') return false;
    if (barangUI.f === 'habis' && s !== 'habis') return false;
    return true;
  }).sort(function (a, b) { return a.nama.localeCompare(b.nama, 'id'); });
  var cols = owner ? 9 : 7;
  $('#bList').innerHTML = rows.length ? rows.map(function (b) {
    var s = st[b.id].sisa, ss = statusStok(b, s);
    var us = (b.units || []).map(function (u) { return '1 ' + esc(u.nama) + ' = ' + fmt(u.isi) + ' ' + esc(b.satuan); }).join('<br>');
    return '<tr class="' + (b.arsip ? '' : ss === 'habis' ? 'out' : ss === 'menipis' ? 'low' : '') + '"><td data-l="Barang"><b>' + esc(b.nama) + '</b>' + (b.arsip ? ' <span class="badge mut">Arsip</span>' : '') + '</td>' +
      '<td data-l="Satuan">' + esc(b.satuan) + (us ? '<br><small>' + us + '</small>' : '') + '</td>' +
      '<td class="r" data-l="Stok">' + qtyHTML(b, s) + '</td><td class="r" data-l="Minimum">' + fmt(b.min) + '</td>' +
      (owner ? '<td class="r" data-l="Modal">' + rp(b.modal) + '</td>' : '') +
      '<td class="r" data-l="Harga jual">' + rp(b.jual) + '<small>/' + esc(b.satuan) + '</small></td>' +
      '<td class="r" data-l="Grosir">' + (b.jualG ? rp(b.jualG) + '<small>/' + esc(b.satuan) + '</small>' : '<small>sama</small>') + '</td>' +
      '<td data-l="Status">' + (b.arsip ? '<span class="badge mut">Tidak aktif</span>' : statusBadge(ss)) + '</td>' +
      (owner ? '<td class="acts-c">' + (b.arsip ? '<button class="btn sm" data-act="barang-aktif" data-id="' + b.id + '" type="button">Aktifkan</button>' :
        '<button class="btn sm" data-act="stok-cepat" data-id="' + b.id + '" type="button">+ Stok</button><button class="btn sm" data-act="barang-edit" data-id="' + b.id + '" type="button">Edit</button>') +
        '<button class="btn sm bad" data-act="barang-hapus" data-id="' + b.id + '" type="button">Hapus</button></td>' : '') + '</tr>';
  }).join('') : '<tr><td colspan="' + cols + '" class="empty nol">' + (d.barang.length ? 'Tidak ada barang yang cocok.' : (owner ? 'Belum ada barang. Klik "+ Tambah Barang".' : 'Belum ada barang.')) + '</td></tr>';
}

/* --- kotak jumlah per satuan (dus / renceng / pcs) --- */
function qtyBoxHTML(b, vals) {
  vals = vals || {};
  return unitsDesc(b).map(function (u) {
    return '<label class="q"><span>' + esc(u.nama) + (u.isi > 1 ? '<small>= ' + fmt(u.isi) + ' ' + esc(b.satuan) + '</small>' : '<small>satuan dasar</small>') + '</span>' +
      '<input type="number" min="0" step="1" inputmode="numeric" class="qi" data-n="' + esc(u.nama) + '" data-isi="' + u.isi + '" placeholder="0" value="' + (vals[u.nama] || '') + '"></label>';
  }).join('');
}
function readQty(box) {
  var tot = 0, bad = false;
  $$('.qi', box).forEach(function (i) {
    var v = i.value.trim(); if (v === '') return;
    var n = Number(v); if (!isFinite(n) || n < 0 || Math.floor(n) !== n) { bad = true; return; }
    tot += n * (+i.getAttribute('data-isi'));
  });
  return { qty: tot, bad: bad };
}
function keepVals(box) { var m = {}; $$('.qi', box).forEach(function (i) { if (i.value !== '') m[i.getAttribute('data-n')] = i.value; }); return m; }

function unitRowHTML(u, base) {
  return '<div class="urow"><input class="u-nama" list="dlGrosir" placeholder="mis. dus" value="' + esc(u ? u.nama : '') + '" autocomplete="off"><span>=</span>' +
    '<input class="u-isi" type="number" min="2" step="1" inputmode="numeric" placeholder="isi" value="' + (u ? u.isi : '') + '"' + (u ? ' data-manual="1"' : '') + '><span class="u-sat">' + esc(base) + '</span>' +
    '<button class="btn sm bad" type="button" data-act="u-del" aria-label="Hapus satuan">&times;</button></div>';
}
function readUnitsRaw() {
  var base = ($('#mSatuan').value || '').trim(), res = [];
  $$('#mUnits .urow').forEach(function (r) { var n = r.querySelector('.u-nama').value.trim(), i = Number(r.querySelector('.u-isi').value); if (n && i >= 2 && Math.floor(i) === i) res.push({ nama: n, isi: i }); });
  return { satuan: base || 'pcs', units: res };
}
function modalHint() {
  var r = readUnitsRaw(), m = getMoney('#mModal', $('#modal')), j = getMoney('#mJual', $('#modal')), jg = getMoney('#mJualG', $('#modal'));
  var out = [];
  r.units.forEach(function (u) { out.push('1 ' + esc(u.nama) + ' = ' + fmt(u.isi) + ' ' + esc(r.satuan) + (m ? ' · modal ' + rp(m * u.isi) : '') + (j ? ' · jual ' + rp(j * u.isi) : '')); });
  var warn = j && m && j < m ? '<br><b>Perhatian:</b> harga jual lebih kecil dari harga modal.' : '';
  if (jg && j && jg > j) warn += '<br><b>Perhatian:</b> harga grosir lebih mahal dari harga eceran.';
  var el = $('#mHint'); if (!el) return;
  el.hidden = !(out.length || warn);
  el.className = 'hint' + (warn ? ' warn' : '');
  el.innerHTML = out.join('<br>') + warn;
}
function rebuildStokAwal() {
  var box = $('#mQty'); if (!box) return;
  var r = readUnitsRaw(), keep = keepVals(box);
  box.innerHTML = qtyBoxHTML({ satuan: r.satuan, units: r.units }, keep);
  updStokAwalTot();
}
function updStokAwalTot() {
  var box = $('#mQty'); if (!box) return;
  var r = readUnitsRaw(), q = readQty(box);
  $('#mQtyTot').innerHTML = q.bad ? '<span style="color:var(--bad)">Jumlah harus bilangan bulat.</span>' : 'Total stok awal: <b>' + fmt(q.qty) + ' ' + esc(r.satuan) + '</b>' + (r.units.length && q.qty ? ' (' + esc(breakdown({ satuan: r.satuan, units: r.units }, q.qty)) + ')' : '');
}
function formBarang(b) {
  var edit = !!b; b = b || { nama: '', satuan: 'pcs', modal: 0, jual: 0, jualG: 0, min: 5, units: [] };
  var h = '<form data-form="barang" data-id="' + (edit ? b.id : '') + '" novalidate><h3>' + (edit ? 'Edit Barang' : 'Tambah Barang') + '</h3>' +
    '<label class="fld"><span>Nama barang</span><input id="mNama" value="' + esc(b.nama) + '" placeholder="Contoh: Indomie Goreng" autocomplete="off"></label>' +
    '<label class="fld"><span>Satuan dasar (satuan terkecil yang dijual eceran)</span><input id="mSatuan" list="dlSatuan" value="' + esc(b.satuan) + '" autocomplete="off"></label>' +
    '<div class="sub">Satuan grosir (opsional)</div><div id="mUnits">' + (b.units || []).map(function (u) { return unitRowHTML(u, b.satuan); }).join('') + '</div>' +
    '<button class="btn sm" type="button" data-act="u-add">+ Tambah satuan grosir</button>' +
    '<div class="hint" id="mHint" hidden style="margin-top:.7em"></div>' +
    '<div class="sub">Harga (per satuan dasar)</div>' +
    '<div class="row2">' + moneyField('mModal', 'Harga modal', b.modal) + moneyField('mJual', 'Harga jual eceran', b.jual) + '</div>' +
    moneyField('mJualG', 'Harga jual grosir (opsional, kosongkan jika sama dengan eceran)', b.jualG) +
    '<label class="fld"><span>Stok minimum (peringatan, dalam satuan dasar)</span><input id="mMin" type="number" min="0" step="1" inputmode="numeric" value="' + b.min + '"></label>' +
    (edit ? '' : '<div class="sub">Stok awal</div><div class="qbox" id="mQty"></div><div class="hint" id="mQtyTot"></div>') +
    '<div class="msg err" id="mMsg"></div><div class="mbtn"><button class="btn" type="button" data-act="modal-close">Batal</button><button class="btn pri" type="submit" id="mSave">Simpan</button></div></form>';
  openModal(h, true);
  modalHint();
  if (!edit) rebuildStokAwal();
}
function saveBarang(form, btn) {
  var id = form.getAttribute('data-id'), d = D(), msg = $('#mMsg');
  var nama = $('#mNama').value.trim(), satuan = $('#mSatuan').value.trim();
  var modal = getMoney('#mModal', form), jual = getMoney('#mJual', form), jualG = getMoney('#mJualG', form), min = Number($('#mMin').value || 0);
  var err = '';
  var units = [];
  if (!nama) err = 'Nama barang wajib diisi.';
  else if (d.barang.some(function (x) { return x.id !== id && !x.arsip && x.nama.toLowerCase() === nama.toLowerCase(); })) err = 'Nama barang sudah ada.';
  else if (!satuan) err = 'Satuan dasar wajib diisi.';
  if (!err) {
    var names = [satuan.toLowerCase()];
    $$('#mUnits .urow').forEach(function (r) {
      if (err) return;
      var n = r.querySelector('.u-nama').value.trim(), iv = r.querySelector('.u-isi').value.trim(), i = Number(iv);
      if (!n && !iv) return;
      if (!n) { err = 'Nama satuan grosir belum diisi.'; return; }
      if (!(i >= 2) || Math.floor(i) !== i) { err = 'Isi "' + n + '" harus bilangan bulat minimal 2.'; return; }
      if (names.indexOf(n.toLowerCase()) >= 0) { err = 'Nama satuan "' + n + '" dobel.'; return; }
      names.push(n.toLowerCase()); units.push({ nama: n, isi: i });
    });
  }
  if (!err && !(jual > 0)) err = 'Harga jual wajib diisi.';
  if (!err && !(min >= 0 && Math.floor(min) === min)) err = 'Stok minimum harus bilangan bulat.';
  var awal = 0;
  if (!err && !id) { var q = readQty($('#mQty')); if (q.bad) err = 'Stok awal harus bilangan bulat.'; awal = q.qty; }
  if (err) { msg.textContent = err; flash(btn, false); return; }
  units.forEach(function (u) { d.presets[u.nama.toLowerCase()] = u.isi; });
  var b;
  if (id) {
    b = barangById(id); b.nama = nama; b.satuan = satuan; b.units = units; b.modal = modal; b.jual = jual; b.jualG = jualG; b.min = min;
  } else {
    b = { id: uid(), nama: nama, satuan: satuan, units: units, modal: modal, jual: jual, jualG: jualG, min: min, arsip: false };
    d.barang.push(b);
    if (awal > 0) d.gerak.push({ id: uid(), t: Date.now(), barangId: b.id, jenis: 'masuk', qty: awal, alasan: 'Stok awal', ket: '', harga: modal, user: S.user.nama });
  }
  if (!save()) { flash(btn, false); return; }
  btn.disabled = true; flash(btn, true, 'Tersimpan ✓', 700);
  setTimeout(function () { closeModal(); refresh(); toast(id ? 'Barang diperbarui.' : 'Barang ditambahkan.', 'ok'); }, 650);
}
function hapusBarang(id) {
  var b = barangById(id); if (!b) return;
  var pakai = D().gerak.some(function (g) { return g.barangId === id && g.ref; }) || D().nota.some(function (n) { return n.items.some(function (i) { return i.barangId === id; }); });
  confirmBox({ judul: pakai ? 'Arsipkan barang?' : 'Hapus barang?', bahaya: true, ya: pakai ? 'Arsipkan' : 'Hapus',
    html: pakai ? '<b>' + esc(b.nama) + '</b> sudah punya riwayat penjualan, jadi tidak dihapus permanen. Barang diarsipkan: tidak tampil di kasir, laporan lama tetap utuh. Bisa diaktifkan lagi.'
      : 'Barang <b>' + esc(b.nama) + '</b> dan seluruh catatan stoknya akan dihapus permanen.' }).then(function (ok) {
    if (!ok) return;
    if (pakai) b.arsip = true; else { D().barang = D().barang.filter(function (x) { return x.id !== id; }); D().gerak = D().gerak.filter(function (g) { return g.barangId !== id; }); }
    save(); refresh(); toast(pakai ? 'Barang diarsipkan.' : 'Barang dihapus.', 'ok');
  });
}

/* =====================================================================
   10. STOK MASUK / KELUAR + RIWAYAT STOK
   ===================================================================== */
var ALASAN_MASUK = ['Pembelian', 'Retur dari pelanggan', 'Koreksi stok'];
var ALASAN_KELUAR = ['Kadaluarsa', 'Rusak', 'Dipakai sendiri', 'Hilang', 'Koreksi stok', 'Lainnya'];
VIEWS.stok = {
  html: function () {
    var d = D(), m = S.stokMode;
    var opts = d.barang.filter(function (b) { return !b.arsip; }).sort(function (a, b) { return a.nama.localeCompare(b.nama, 'id'); });
    if (!S.riw) S.riw = { q: '', jenis: '', dari: addDays(today(), -30), sampai: today() };
    var h = '<div class="ph"><h1>Stok Masuk / Keluar</h1></div><div class="card"><div class="seg" id="sSeg"><button type="button" data-act="smode" data-v="masuk" class="masuk' + (m === 'masuk' ? ' on' : '') + '">Barang Masuk</button><button type="button" data-act="smode" data-v="keluar" class="keluar' + (m === 'keluar' ? ' on' : '') + '">Barang Keluar</button></div>' +
      '<form data-form="stok" novalidate style="margin-top:1em">';
    if (!opts.length) h += '<div class="empty">Belum ada barang. Tambah barang dulu di menu Barang.</div></form></div>';
    else {
      h += '<div class="row2"><label class="fld"><span>Barang</span><select id="sBarang">' + opts.map(function (b) { return '<option value="' + b.id + '">' + esc(b.nama) + '</option>'; }).join('') + '</select></label>' +
        '<label class="fld"><span>Tanggal</span><input id="sTgl" type="date" value="' + today() + '" max="' + today() + '"></label></div>' +
        '<div class="hint" id="sInfo"></div>' +
        '<div class="fld"><span style="font-weight:600;font-size:.88rem;display:block;margin-bottom:.3em">Jumlah (isi salah satu atau beberapa)</span><div class="qbox" id="sQty"></div><div class="hint" id="sTot" style="margin-top:.6em"></div></div>' +
        '<div id="sMasukW">' + moneyField('sHarga', 'Harga modal per satuan dasar', 0) + '<div class="hint" id="sBeli"></div>' +
        '<label class="chk"><input type="checkbox" id="sUpd" checked> Perbarui harga modal barang dengan harga ini</label></div>' +
        '<div class="row2"><label class="fld"><span>Alasan</span><select id="sAlasan"></select></label><label class="fld"><span id="sKetL">Keterangan / supplier (opsional)</span><input id="sKet" autocomplete="off"></label></div>' +
        '<div class="msg" id="sMsg"></div><button class="btn pri lg" type="submit" id="sSave">Simpan</button></form></div>';
      h += '<div class="card"><h2>Riwayat stok</h2><div class="tools"><input id="rQ" class="inp" placeholder="Cari barang…" value="' + esc(S.riw.q) + '">' +
        '<select id="rJenis" class="inp"><option value="">Masuk &amp; keluar</option><option value="masuk">Masuk saja</option><option value="keluar">Keluar saja</option></select>' +
        '<input id="rDari" type="date" class="inp" value="' + S.riw.dari + '"><input id="rSampai" type="date" class="inp" value="' + S.riw.sampai + '"></div>' +
        '<div class="tw"><table class="rt"><thead><tr><th>Waktu</th><th>Barang</th><th>Jenis</th><th class="r">Jumlah</th><th class="r">Saldo</th><th>Alasan</th><th>Oleh</th></tr></thead><tbody id="rList"></tbody></table></div></div>';
    }
    return h;
  },
  after: function () {
    if (!$('#sBarang')) return;
    if (S.stokPre && barangById(S.stokPre) && !barangById(S.stokPre).arsip) $('#sBarang').value = S.stokPre;
    S.stokPre = null;
    $('#rJenis').value = S.riw.jenis;
    stokPilih();
    renderRiwayat($('#rList'), S.riw, true);
  }
};
function stokPilih() {
  var b = barangById($('#sBarang').value); if (!b) return;
  var m = S.stokMode, st = stok()[b.id];
  $('#sQty').innerHTML = qtyBoxHTML(b);
  $('#sMasukW').hidden = m !== 'masuk';
  $('#sAlasan').innerHTML = (m === 'masuk' ? ALASAN_MASUK : ALASAN_KELUAR).map(function (a) { return '<option>' + a + '</option>'; }).join('');
  $('#sKetL').textContent = m === 'masuk' ? 'Keterangan / supplier (opsional)' : 'Keterangan (opsional)';
  $('#sSave').textContent = m === 'masuk' ? 'Simpan Barang Masuk' : 'Simpan Barang Keluar';
  $('#sSave').dataset.orig = $('#sSave').textContent;
  setMoney($('#sHarga'), b.modal);
  $('#sInfo').innerHTML = 'Stok sekarang: <b>' + fmt(st.sisa) + ' ' + esc(b.satuan) + '</b>' + (b.units.length ? ' (' + esc(breakdown(b, st.sisa)) + ')' : '') + ' · Minimum ' + fmt(b.min);
  stokHitung();
}
function stokHitung() {
  var b = barangById($('#sBarang').value); if (!b) return;
  var q = readQty($('#sQty')), m = S.stokMode, sisa = stok()[b.id].sisa;
  var after = m === 'masuk' ? sisa + q.qty : sisa - q.qty;
  $('#sTot').innerHTML = q.bad ? '<span style="color:var(--bad)">Jumlah harus bilangan bulat.</span>' :
    (m === 'masuk' ? 'Menambah ' : 'Mengurangi ') + '<b>' + fmt(q.qty) + ' ' + esc(b.satuan) + '</b>' + (b.units.length && q.qty ? ' (' + esc(breakdown(b, q.qty)) + ')' : '') + ' → stok menjadi <b>' + fmt(after) + ' ' + esc(b.satuan) + '</b>';
  if (m === 'masuk') { var h = getMoney('#sHarga'); $('#sBeli').innerHTML = 'Total pembelian: <b>' + rp(h * q.qty) + '</b>'; }
}
function saveStok(btn) {
  var b = barangById($('#sBarang').value), m = S.stokMode, msg = $('#sMsg');
  var q = readQty($('#sQty')), tgl = $('#sTgl').value || today(), alasan = $('#sAlasan').value, ket = $('#sKet').value.trim();
  var err = '';
  if (!b) err = 'Pilih barang.';
  else if (q.bad) err = 'Jumlah harus bilangan bulat.';
  else if (!(q.qty > 0)) err = 'Isi jumlah barang dulu.';
  else if (m === 'keluar' && q.qty > stok()[b.id].sisa) err = 'Stok tidak cukup. Sisa ' + fmt(stok()[b.id].sisa) + ' ' + b.satuan + '.';
  else if (tgl > today()) err = 'Tanggal tidak boleh di masa depan.';
  var harga = m === 'masuk' ? getMoney('#sHarga') : b ? b.modal : 0;
  if (!err && m === 'masuk' && alasan === 'Pembelian' && !(harga > 0)) err = 'Isi harga modal untuk pembelian.';
  if (err) { msg.className = 'msg err'; msg.textContent = err; flash(btn, false); return; }
  var t = tgl === today() ? Date.now() : startOf(tgl) + 12 * 3600000;
  D().gerak.push({ id: uid(), t: t, barangId: b.id, jenis: m, qty: q.qty, alasan: alasan, ket: ket, harga: harga, user: S.user.nama });
  var info = '';
  if (m === 'masuk' && $('#sUpd').checked && harga > 0 && harga !== b.modal) { b.modal = harga; info = ' Harga modal diperbarui.'; }
  if (!save()) { flash(btn, false); return; }
  var txt = (m === 'masuk' ? '+' : '-') + fmt(q.qty) + ' ' + b.satuan + ' ' + b.nama;
  flash(btn, true, 'Tersimpan ✓', 900);
  toast(txt + ' tercatat.' + info, 'ok');
  $$('#sQty .qi').forEach(function (i) { i.value = ''; }); $('#sKet').value = '';
  var st = stok()[b.id];
  $('#sInfo').innerHTML = 'Stok sekarang: <b>' + fmt(st.sisa) + ' ' + esc(b.satuan) + '</b>' + (b.units.length ? ' (' + esc(breakdown(b, st.sisa)) + ')' : '') + ' · Minimum ' + fmt(b.min);
  stokHitung(); msg.textContent = '';
  renderRiwayat($('#rList'), S.riw, true);
}
function saldoMap() {
  var g = D().gerak.slice().sort(function (a, b) { return a.t - b.t || 0; }), run = {}, map = {};
  g.forEach(function (x) { run[x.barangId] = (run[x.barangId] || 0) + (x.jenis === 'masuk' ? x.qty : -x.qty); map[x.id] = run[x.barangId]; });
  return map;
}
function renderRiwayat(tbody, f, limit) {
  var d = D(), q = (f.q || '').toLowerCase(), sm = saldoMap();
  var from = f.dari ? startOf(f.dari) : 0, to = f.sampai ? endOf(f.sampai) : Infinity;
  var rows = d.gerak.filter(function (g) { var b = barangById(g.barangId); return b && g.t >= from && g.t <= to && (!f.jenis || g.jenis === f.jenis) && (!q || b.nama.toLowerCase().indexOf(q) >= 0); }).sort(function (a, b) { return b.t - a.t; });
  var total = rows.length; if (limit) rows = rows.slice(0, 150);
  tbody.innerHTML = rows.length ? rows.map(function (g) {
    var b = barangById(g.barangId);
    return '<tr><td data-l="Waktu" class="nowrap">' + fdt(g.t) + '</td><td data-l="Barang"><b>' + esc(b.nama) + '</b></td><td data-l="Jenis"><span class="badge ' + (g.jenis === 'masuk' ? 'ok' : 'bad') + '">' + (g.jenis === 'masuk' ? 'Masuk' : 'Keluar') + '</span></td>' +
      '<td class="r" data-l="Jumlah">' + (g.jenis === 'masuk' ? '+' : '-') + fmt(g.qty) + ' ' + esc(b.satuan) + (b.units.length ? '<br><small>' + esc(breakdown(b, g.qty)) + '</small>' : '') + '</td>' +
      '<td class="r" data-l="Saldo">' + fmt(sm[g.id]) + '</td><td data-l="Alasan">' + esc(g.alasan) + (g.ket ? '<br><small>' + esc(g.ket) + '</small>' : '') + '</td><td data-l="Oleh">' + esc(g.user || '') + '</td></tr>';
  }).join('') + (total > rows.length ? '<tr><td colspan="7" class="empty nol">Menampilkan ' + rows.length + ' dari ' + total + ' catatan. Persempit filter tanggal.</td></tr>' : '') :
    '<tr><td colspan="7" class="empty nol">Belum ada catatan pada filter ini.</td></tr>';
}

/* =====================================================================
   11. KASIR
   ===================================================================== */
function calcCart() {
  var st = stok(), need = {}, lines = [], sub = 0;
  S.cart.forEach(function (c, i) {
    var b = barangById(c.barangId); if (!b || b.arsip) return;
    var isi = isiOf(b, c.unit), harga = isi * hargaJual(b, S.kmode), jml = c.jumlah, qty = jml * isi;
    need[b.id] = (need[b.id] || 0) + qty;
    lines.push({ i: i, b: b, c: c, isi: isi, harga: harga, sub: harga * jml, qty: qty });
    sub += harga * jml;
  });
  lines.forEach(function (l) { l.err = need[l.b.id] > st[l.b.id].sisa ? 'Stok tidak cukup (sisa ' + fmt(st[l.b.id].sisa) + ' ' + l.b.satuan + ')' : (!(l.c.jumlah >= 1) || Math.floor(l.c.jumlah) !== l.c.jumlah ? 'Jumlah harus bilangan bulat' : ''); });
  var dp = S.kmode === 'grosir' ? Math.min(100, Math.max(0, parseFloat(String(S.k.diskon).replace(',', '.')) || 0)) : 0;
  var diskon = Math.round(sub * dp / 100);
  return { lines: lines, subtotal: sub, diskonP: dp, diskon: diskon, total: sub - diskon, hasErr: lines.some(function (l) { return l.err; }) };
}
VIEWS.kasir = {
  html: function () {
    var g = S.kmode === 'grosir';
    return '<div class="ph"><h1>Kasir</h1><div class="seg"><button type="button" data-act="kmode" data-v="eceran" class="' + (!g ? 'on' : '') + '">Eceran</button><button type="button" data-act="kmode" data-v="grosir" class="' + (g ? 'on' : '') + '">Grosir</button></div></div>' +
      '<div class="pos"><section class="card"><input id="kSearch" class="inp" placeholder="Cari barang… (klik barang untuk menambah)" autocomplete="off"><div class="plist" id="kList"></div></section>' +
      '<section class="card" id="kCartCard"><h2>Keranjang <small id="kMode">' + (g ? '(harga grosir)' : '(harga eceran)') + '</small></h2>' +
      '<div id="kGrosirW"' + (g ? '' : ' hidden') + '><div class="row2"><label class="fld"><span>Nama pembeli</span><input id="kPembeli" value="' + esc(S.k.pembeli) + '" autocomplete="off"></label><label class="fld"><span>Diskon (%)</span><input id="kDiskon" type="number" min="0" max="100" step="0.5" inputmode="decimal" value="' + esc(S.k.diskon) + '"></label></div></div>' +
      '<div id="kCart"></div>' +
      '<div id="kTotals"></div>' +
      moneyField('kBayar', 'Uang bayar', S.k.bayar) +
      '<div class="quick" id="kQuick"></div><div class="tot"><span>Kembalian</span><b id="kKembali">Rp 0</b></div><div class="msg" id="kMsg"></div>' +
      '<button class="btn pri lg" id="kBayarBtn" data-act="bayar" type="button">Bayar &amp; Cetak Nota</button>' +
      '<button class="btn bad" style="width:100%;margin-top:.5em" data-act="kosong" type="button">Kosongkan keranjang</button></section></div>' +
      '<div class="kbar" id="kBar" hidden><span id="kBarTxt"></span><button class="btn" type="button" data-act="ke-keranjang">Lihat keranjang</button></div>';
  },
  after: function () { renderPList(); renderCart(); }
};
function renderPList() {
  var q = ($('#kSearch') ? $('#kSearch').value : '').trim().toLowerCase(), st = stok();
  var list = D().barang.filter(function (b) { return !b.arsip && (!q || b.nama.toLowerCase().indexOf(q) >= 0); }).sort(function (a, b) { return a.nama.localeCompare(b.nama, 'id'); }).slice(0, 60);
  $('#kList').innerHTML = list.length ? list.map(function (b) {
    var s = st[b.id].sisa;
    return '<button type="button" class="pc" data-act="add" data-id="' + b.id + '"' + (s <= 0 ? ' disabled' : '') + '><span class="n">' + esc(b.nama) + '</span><span class="p">' + rp(hargaJual(b, S.kmode)) + '<small>/' + esc(b.satuan) + '</small></span><span class="s">' + (s <= 0 ? 'Stok habis' : 'Stok ' + fmt(s) + ' ' + esc(b.satuan)) + (s > 0 && s <= b.min ? ' · menipis' : '') + '</span></button>';
  }).join('') : '<div class="empty" style="grid-column:1/-1">' + (D().barang.length ? 'Barang tidak ditemukan.' : 'Belum ada barang. Pemilik dapat menambah di menu Barang.') + '</div>';
}
function renderCart() {
  var c = calcCart();
  $('#kCart').innerHTML = c.lines.length ? c.lines.map(function (l) {
    return '<div class="cl' + (l.err ? ' bad' : '') + '"><div class="cl-h"><span>' + esc(l.b.nama) + '</span><span>' + rp(l.sub) + '</span></div>' +
      '<div class="cl-b"><input type="number" min="1" step="1" inputmode="numeric" class="c-qty" data-i="' + l.i + '" value="' + l.c.jumlah + '"><select class="c-unit" data-i="' + l.i + '">' +
      unitsOf(l.b).map(function (u) { return '<option value="' + esc(u.nama) + '"' + (u.nama === l.c.unit ? ' selected' : '') + '>' + esc(u.nama) + (u.isi > 1 ? ' (' + fmt(u.isi) + ' ' + esc(l.b.satuan) + ')' : '') + '</option>'; }).join('') +
      '</select><small>@ ' + rp(l.harga) + '</small><button type="button" class="btn sm bad" data-act="del" data-i="' + l.i + '" aria-label="Hapus">&times;</button></div>' +
      (l.isi > 1 ? '<small>= ' + fmt(l.qty) + ' ' + esc(l.b.satuan) + '</small>' : '') + (l.err ? '<div class="msg err" style="margin:.2em 0 0">' + esc(l.err) + '</div>' : '') + '</div>';
  }).join('') : '<div class="empty">Keranjang kosong. Klik barang di sebelah kiri.</div>';
  renderTotals();
}
function renderTotals() {
  var c = calcCart(), g = S.kmode === 'grosir';
  $('#kTotals').innerHTML = '<div class="tot"><span>Subtotal</span><span>' + rp(c.subtotal) + '</span></div>' +
    (g ? '<div class="tot"><span>Diskon ' + (c.diskonP ? c.diskonP + '%' : '') + '</span><span>-' + rp(c.diskon) + '</span></div>' : '') +
    '<div class="tot g"><span>Total</span><span>' + rp(c.total) + '</span></div>';
  var bar = $('#kBar');
  if (bar) { var nItem = sum(c.lines, function (l) { return l.c.jumlah; }); bar.hidden = !c.lines.length; $('#kBarTxt').innerHTML = nItem + ' item &middot; <b>' + rp(c.total) + '</b>'; }
  var bayar = S.k.bayar || 0, kem = bayar - c.total;
  $('#kKembali').textContent = rp(Math.max(0, kem));
  $('#kKembali').style.color = kem < 0 && bayar > 0 ? 'var(--bad)' : '';
  var qb = [c.total, 5000, 10000, 20000, 50000, 100000].filter(function (v, i, a) { return v > 0 && a.indexOf(v) === i; });
  var ceil = function (n, s) { return Math.ceil(n / s) * s; };
  if (c.total > 0) { qb = [c.total]; [5000, 10000, 20000, 50000, 100000].forEach(function (s) { var v = ceil(c.total, s); if (qb.indexOf(v) < 0 && qb.length < 5) qb.push(v); }); }
  $('#kQuick').innerHTML = qb.map(function (v, i) { return '<button type="button" class="btn sm" data-act="quick" data-v="' + v + '">' + (i === 0 ? 'Uang pas' : fmt(v)) + '</button>'; }).join('');
}
function addToCart(id) {
  var b = barangById(id); if (!b) return;
  var us = unitsDesc(b), unit = S.kmode === 'grosir' ? us[0].nama : b.satuan;
  var ex = S.cart.filter(function (c) { return c.barangId === id && c.unit === unit; })[0];
  if (ex) ex.jumlah++; else S.cart.push({ barangId: id, unit: unit, jumlah: 1 });
  renderCart();
  var l = calcCart().lines.filter(function (x) { return x.b.id === id; });
  if (l.some(function (x) { return x.err; })) toast('Stok ' + b.nama + ' tidak cukup untuk jumlah itu.', 'warn');
}
function bayar(btn) {
  var c = calcCart(), msg = $('#kMsg'), bayarN = S.k.bayar || 0;
  function gagal(t) { msg.className = 'msg err'; msg.textContent = t; flash(btn, false); }
  if (!c.lines.length) return gagal('Keranjang masih kosong.');
  if (c.hasErr) return gagal('Perbaiki dulu barang yang stoknya tidak cukup.');
  if (bayarN < c.total) return gagal('Uang bayar kurang ' + rp(c.total - bayarN) + '.');
  var res = buatNota(S.cart.map(function (x) { return { barangId: x.barangId, unit: x.unit, jumlah: x.jumlah }; }),
    { mode: S.kmode, pembeli: S.k.pembeli.trim(), diskonP: c.diskonP, bayar: bayarN, kasir: S.user.nama, kasirId: S.user.id });
  if (res.err) return gagal(res.err);
  if (!save()) { return gagal('Gagal menyimpan data.'); }
  btn.disabled = true; msg.textContent = '';
  flash(btn, true, 'Pembayaran berhasil ✓', 700);
  var nota = res.nota;
  setTimeout(function () {
    S.cart = []; S.k = { pembeli: '', diskon: '', bayar: 0 };
    btn.disabled = false;
    if (S.view === 'kasir') render(false);
    showNota(nota, true);
  }, 650);
}

/* =====================================================================
   12. NOTA & CETAK
   ===================================================================== */
function notaHTML(n) {
  var t = D().toko;
  var h = '<div class="nota">' + (n.batal ? '<div class="stamp">DIBATALKAN</div>' : '') + '<h4>' + esc(t.nama) + '</h4>' +
    '<div class="c">' + (t.alamat ? esc(t.alamat) + '<br>' : '') + (t.telp ? 'Telp ' + esc(t.telp) : '') + '</div><hr>' +
    '<div class="ln"><span>No</span><span>' + esc(n.no) + '</span></div><div class="ln"><span>Tanggal</span><span>' + fdt(n.t) + '</span></div>' +
    '<div class="ln"><span>Kasir</span><span>' + esc(n.kasir) + '</span></div><div class="ln"><span>Jenis</span><span>' + (n.mode === 'grosir' ? 'GROSIR' : 'ECERAN') + '</span></div>' +
    (n.pembeli ? '<div class="ln"><span>Pembeli</span><span>' + esc(n.pembeli) + '</span></div>' : '') + '<hr>';
  n.items.forEach(function (it) {
    h += '<div class="it"><div>' + esc(it.nama) + '</div><div class="ln"><span>' + fmt(it.jumlah) + ' ' + esc(it.unit) + ' x ' + fmt(it.harga) + '</span><span>' + fmt(it.sub) + '</span></div>' +
      (it.isi > 1 ? '<small>(' + fmt(it.qty) + ' ' + esc(it.satuan) + ')</small>' : '') + '</div>';
  });
  h += '<hr><div class="ln"><span>Subtotal</span><span>' + fmt(n.subtotal) + '</span></div>' +
    (n.diskon ? '<div class="ln"><span>Diskon ' + n.diskonP + '%</span><span>-' + fmt(n.diskon) + '</span></div>' : '') +
    '<div class="ln"><b>TOTAL</b><b>' + fmt(n.total) + '</b></div><div class="ln"><span>Bayar</span><span>' + fmt(n.bayar) + '</span></div><div class="ln"><span>Kembali</span><span>' + fmt(n.kembali) + '</span></div><hr>' +
    '<div class="c">' + esc(t.footer || 'Terima kasih') + '</div><div class="c" style="margin-top:4px">Stok otomatis diperbarui</div></div>';
  return h;
}
function showNota(n, baru) {
  var owner = isOwner();
  openModal('<h3>' + (baru ? 'Pembayaran berhasil' : 'Nota ' + esc(n.no)) + '</h3>' + notaHTML(n) +
    '<div class="mbtn"><button class="btn" type="button" data-act="modal-close">Tutup</button>' +
    (owner && !n.batal ? '<button class="btn bad" type="button" data-act="nota-batal" data-id="' + n.id + '">Batalkan nota</button>' : '') +
    '<button class="btn pri" type="button" data-act="nota-print" data-id="' + n.id + '">Cetak nota</button></div>');
}
function cetak(html, cls) {
  var pa = $('#printArea');
  pa.innerHTML = html; if (cls) pa.className = cls;
  var done = function () { pa.innerHTML = ''; pa.className = ''; window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done);
  setTimeout(function () { try { window.print(); } catch (e) { toast('Browser tidak bisa mencetak.', 'err'); } }, 60);
}

/* =====================================================================
   13. TRANSAKSI
   ===================================================================== */
VIEWS.transaksi = {
  html: function () {
    if (!S.trx) S.trx = { dari: today().slice(0, 8) + '01', sampai: today(), q: '', mode: '', status: '' };
    var f = S.trx;
    return '<div class="ph"><h1>Riwayat Transaksi</h1></div><div class="card"><div class="tools">' +
      '<input id="tQ" class="inp" placeholder="Cari no. nota / pembeli…" value="' + esc(f.q) + '"><input id="tDari" type="date" class="inp" value="' + f.dari + '"><input id="tSampai" type="date" class="inp" value="' + f.sampai + '">' +
      '<select id="tMode" class="inp"><option value="">Eceran &amp; grosir</option><option value="eceran">Eceran</option><option value="grosir">Grosir</option></select>' +
      '<select id="tStatus" class="inp"><option value="">Semua status</option><option value="ok">Berhasil</option><option value="batal">Dibatalkan</option></select></div>' +
      '<div id="tSum" class="hint"></div><div class="tw"><table class="rt"><thead><tr><th>No. nota</th><th>Waktu</th><th>Kasir</th><th>Jenis</th><th>Pembeli</th><th class="r">Total</th><th>Status</th><th></th></tr></thead><tbody id="tList"></tbody></table></div></div>';
  },
  after: function () { $('#tMode').value = S.trx.mode; $('#tStatus').value = S.trx.status; renderTrx(); }
};
function renderTrx() {
  var f = S.trx, q = f.q.trim().toLowerCase(), from = f.dari ? startOf(f.dari) : 0, to = f.sampai ? endOf(f.sampai) : Infinity, owner = isOwner();
  var rows = D().nota.filter(function (n) {
    if (!owner && n.kasirId !== S.user.id) return false;
    if (n.t < from || n.t > to) return false;
    if (f.mode && n.mode !== f.mode) return false;
    if (f.status === 'ok' && n.batal) return false; if (f.status === 'batal' && !n.batal) return false;
    return !q || n.no.toLowerCase().indexOf(q) >= 0 || (n.pembeli || '').toLowerCase().indexOf(q) >= 0;
  }).sort(function (a, b) { return b.t - a.t; });
  var okRows = rows.filter(function (n) { return !n.batal; });
  $('#tSum').innerHTML = '<b>' + rows.length + '</b> transaksi · Total penjualan berhasil: <b>' + rp(sum(okRows, function (n) { return n.total; })) + '</b>' + (!owner ? ' <small>(hanya transaksi Anda)</small>' : '');
  $('#tList').innerHTML = rows.length ? rows.slice(0, 300).map(function (n) {
    return '<tr' + (n.batal ? ' class="out"' : '') + '><td data-l="Nota"><b>' + esc(n.no) + '</b></td><td data-l="Waktu" class="nowrap">' + fdt(n.t) + '</td><td data-l="Kasir">' + esc(n.kasir) + '</td>' +
      '<td data-l="Jenis">' + (n.mode === 'grosir' ? '<span class="badge pri">Grosir</span>' : '<span class="badge mut">Eceran</span>') + '</td><td data-l="Pembeli">' + esc(n.pembeli || '-') + '</td>' +
      '<td class="r" data-l="Total">' + rp(n.total) + '</td><td data-l="Status">' + (n.batal ? '<span class="badge bad">Dibatalkan</span>' : '<span class="badge ok">Berhasil</span>') + '</td>' +
      '<td class="acts-c"><button class="btn sm" type="button" data-act="nota-lihat" data-id="' + n.id + '">Lihat / Cetak</button></td></tr>';
  }).join('') + (rows.length > 300 ? '<tr><td colspan="8" class="empty nol">Menampilkan 300 transaksi terbaru. Persempit filter tanggal.</td></tr>' : '') : '<tr><td colspan="8" class="empty nol">Tidak ada transaksi pada filter ini.</td></tr>';
}

/* =====================================================================
   14. LAPORAN
   ===================================================================== */
function lapRange() {
  var L = S.lap;
  if (L.tipe === 'harian') return { a: L.tgl, b: L.tgl, judul: 'Laporan Harian ' + fd(L.tgl) };
  if (L.tipe === 'bulanan') return { a: L.bln + '-01', b: lastDayOfMonth(L.bln), judul: 'Laporan Bulanan ' + fbulan(L.bln) };
  var a = L.dari, b = L.sampai; if (a > b) { var t = a; a = b; b = t; }
  return { a: a, b: b, judul: 'Laporan ' + fd(a) + ' s.d. ' + fd(b) };
}
VIEWS.laporan = {
  html: function () {
    if (!S.lap) S.lap = { tipe: 'harian', tgl: today(), bln: today().slice(0, 7), dari: today().slice(0, 8) + '01', sampai: today() };
    var L = S.lap;
    var h = '<div class="ph"><h1>Laporan</h1><div class="acts"><button class="btn" type="button" data-act="lap-csv">Unduh CSV</button><button class="btn pri" type="button" data-act="lap-print">Cetak laporan</button></div></div>' +
      '<div class="card"><div class="filter"><div class="seg">' + [['harian', 'Harian'], ['bulanan', 'Bulanan'], ['rentang', 'Rentang']].map(function (x) { return '<button type="button" data-act="lap-tipe" data-v="' + x[0] + '" class="' + (L.tipe === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div>';
    if (L.tipe === 'harian') h += '<label class="fld"><span>Tanggal</span><input type="date" id="lTgl" value="' + L.tgl + '" max="' + today() + '"></label>' +
      '<button class="btn sm" type="button" data-act="lap-set" data-v="hari">Hari ini</button><button class="btn sm" type="button" data-act="lap-set" data-v="kemarin">Kemarin</button>';
    else if (L.tipe === 'bulanan') h += '<label class="fld"><span>Bulan</span><input type="month" id="lBln" value="' + L.bln + '"></label>' +
      '<button class="btn sm" type="button" data-act="lap-set" data-v="bulan">Bulan ini</button><button class="btn sm" type="button" data-act="lap-set" data-v="bulanlalu">Bulan lalu</button>';
    else h += '<label class="fld"><span>Dari</span><input type="date" id="lDari" value="' + L.dari + '"></label><label class="fld"><span>Sampai</span><input type="date" id="lSampai" value="' + L.sampai + '"></label>' +
      '<button class="btn sm" type="button" data-act="lap-set" data-v="7hari">7 hari terakhir</button><button class="btn sm" type="button" data-act="lap-set" data-v="30hari">30 hari</button>';
    h += '</div></div><div id="lapArea">' + lapHTML() + '</div>';
    return h;
  }
};
function lapHTML() {
  var R = lapRange(), r = calc(startOf(R.a), endOf(R.b)), d = D();
  var margin = r.pemasukan ? Math.round(r.laba / r.pemasukan * 1000) / 10 : 0;
  var h = '<div class="rpt"><h2 style="margin:.2em 0 .1em">' + esc(R.judul) + '</h2><div class="mut" style="margin-bottom:.8em">' + esc(d.toko.nama) + '</div>' +
    '<div class="cards"><div class="stat"><div class="l">Pemasukan (penjualan)</div><div class="v">' + rp(r.pemasukan) + '</div><div class="s">' + r.trx + ' transaksi' + (r.diskon ? ' · diskon ' + rp(r.diskon) : '') + '</div></div>' +
    '<div class="stat warn"><div class="l">Pembelian barang</div><div class="v">' + rp(r.pembelian) + '</div><div class="s">Barang masuk berjenis pembelian</div></div>' +
    '<div class="stat"><div class="l">Jumlah barang terjual</div><div class="v">' + fmt(r.terjual) + '</div><div class="s">dalam satuan dasar (pcs, sachet, botol, dst.)</div></div>' +
    '<div class="stat ok"><div class="l">Keuntungan kotor</div><div class="v">' + rp(r.laba) + '</div><div class="s">Pemasukan ' + rp(r.pemasukan) + ' &minus; modal ' + rp(r.hpp) + ' (' + margin + '%)</div></div></div>';
  var dayKeys = []; for (var k = R.a; k <= R.b; k = addDays(k, 1)) { dayKeys.push(k); if (dayKeys.length > 400) break; }
  if (dayKeys.length > 1 && dayKeys.length <= 62) {
    h += '<div class="card"><h3>Grafik pemasukan per hari</h3>' + miniBars(dayKeys.map(function (k) { return { l: k.slice(8), t: fd(k), v: (r.days[k] || { pemasukan: 0 }).pemasukan }; })) + '</div>';
  }
  if (dayKeys.length > 1) {
    var act = Object.keys(r.days).sort();
    h += '<div class="card"><h3>Rekap per hari</h3>' + (act.length ? '<div class="tw"><table class="rt"><thead><tr><th>Tanggal</th><th class="r">Transaksi</th><th class="r">Pemasukan</th><th class="r">Modal</th><th class="r">Keuntungan kotor</th><th class="r">Pembelian</th></tr></thead><tbody>' + act.map(function (k) {
      var x = r.days[k]; return '<tr><td data-l="Tanggal">' + fd(k) + '</td><td class="r" data-l="Transaksi">' + x.trx + '</td><td class="r" data-l="Pemasukan">' + rp(x.pemasukan) + '</td><td class="r" data-l="Modal">' + rp(x.hpp) + '</td><td class="r" data-l="Keuntungan">' + rp(x.pemasukan - x.hpp) + '</td><td class="r" data-l="Pembelian">' + rp(x.pembelian) + '</td></tr>';
    }).join('') + '<tr><td class="b" data-l="Total">Total</td><td class="r b" data-l="Transaksi">' + r.trx + '</td><td class="r b" data-l="Pemasukan">' + rp(r.pemasukan) + '</td><td class="r b" data-l="Modal">' + rp(r.hpp) + '</td><td class="r b" data-l="Keuntungan">' + rp(r.laba) + '</td><td class="r b" data-l="Pembelian">' + rp(r.pembelian) + '</td></tr></tbody></table></div>' : '<div class="empty">Tidak ada aktivitas.</div>') + '</div>';
  }
  h += '<div class="card"><h3>Barang terlaris</h3>' + (r.terlaris.length ? '<div class="tw"><table class="rt"><thead><tr><th>#</th><th>Barang</th><th class="r">Terjual</th><th class="r">Pendapatan</th><th class="r">Keuntungan</th></tr></thead><tbody>' + r.terlaris.slice(0, 15).map(function (x, i) {
    var b = barangById(x.id);
    return '<tr><td data-l="#">' + (i + 1) + '</td><td data-l="Barang"><b>' + esc(x.nama) + '</b></td><td class="r" data-l="Terjual">' + fmt(x.qty) + ' ' + esc(x.satuan) + (b && b.units.length ? '<br><small>' + esc(breakdown(b, x.qty)) + '</small>' : '') + '</td><td class="r" data-l="Pendapatan">' + rp(x.pendapatan) + '</td><td class="r" data-l="Keuntungan">' + rp(x.pendapatan - x.hpp) + '</td></tr>';
  }).join('') + '</tbody></table></div>' : '<div class="empty">Belum ada penjualan pada periode ini.</div>') + '</div>';
  var gr = d.gerak.filter(function (g) { return g.t >= startOf(R.a) && g.t <= endOf(R.b) && barangById(g.barangId); }).sort(function (a, b) { return b.t - a.t; });
  var sm = saldoMap();
  h += '<div class="card"><h3>Riwayat stok (' + gr.length + ' catatan)</h3>' + (gr.length ? '<div class="tw"><table class="rt"><thead><tr><th>Waktu</th><th>Barang</th><th>Jenis</th><th class="r">Jumlah</th><th class="r">Saldo</th><th>Alasan</th></tr></thead><tbody>' + gr.slice(0, 120).map(function (g) {
    var b = barangById(g.barangId);
    return '<tr><td data-l="Waktu" class="nowrap">' + fdt(g.t) + '</td><td data-l="Barang">' + esc(b.nama) + '</td><td data-l="Jenis">' + (g.jenis === 'masuk' ? 'Masuk' : 'Keluar') + '</td><td class="r" data-l="Jumlah">' + (g.jenis === 'masuk' ? '+' : '-') + fmt(g.qty) + ' ' + esc(b.satuan) + '</td><td class="r" data-l="Saldo">' + fmt(sm[g.id]) + '</td><td data-l="Alasan">' + esc(g.alasan) + (g.ket ? ' · ' + esc(g.ket) : '') + '</td></tr>';
  }).join('') + '</tbody></table></div>' + (gr.length > 120 ? '<small>Menampilkan 120 terbaru. CSV memuat semuanya.</small>' : '') : '<div class="empty">Tidak ada pergerakan stok.</div>') + '</div></div>';
  return h;
}
function csvCell(v) { v = String(v == null ? '' : v); return /[;"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
function unduh(nama, isi, tipe) {
  var blob = new Blob([isi], { type: tipe }), a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = nama; document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
function lapCSV() {
  var R = lapRange(), r = calc(startOf(R.a), endOf(R.b)), rows = [];
  rows.push([R.judul]); rows.push([D().toko.nama]); rows.push([]);
  rows.push(['RINGKASAN']); rows.push(['Pemasukan', r.pemasukan]); rows.push(['Pembelian', r.pembelian]); rows.push(['Jumlah barang terjual (satuan dasar)', r.terjual]); rows.push(['Modal barang terjual', r.hpp]); rows.push(['Keuntungan kotor', r.laba]); rows.push(['Jumlah transaksi', r.trx]); rows.push([]);
  rows.push(['REKAP PER HARI']); rows.push(['Tanggal', 'Transaksi', 'Pemasukan', 'Modal', 'Keuntungan kotor', 'Pembelian']);
  Object.keys(r.days).sort().forEach(function (k) { var x = r.days[k]; rows.push([fd(k), x.trx, x.pemasukan, x.hpp, x.pemasukan - x.hpp, x.pembelian]); });
  rows.push([]); rows.push(['BARANG TERLARIS']); rows.push(['Barang', 'Terjual (satuan dasar)', 'Satuan', 'Pendapatan', 'Keuntungan']);
  r.terlaris.forEach(function (x) { rows.push([x.nama, x.qty, x.satuan, x.pendapatan, x.pendapatan - x.hpp]); });
  rows.push([]); rows.push(['RIWAYAT STOK']); rows.push(['Waktu', 'Barang', 'Jenis', 'Jumlah (satuan dasar)', 'Alasan', 'Keterangan', 'Oleh']);
  D().gerak.filter(function (g) { return g.t >= startOf(R.a) && g.t <= endOf(R.b) && barangById(g.barangId); }).sort(function (a, b) { return a.t - b.t; }).forEach(function (g) { rows.push([fdt(g.t), barangById(g.barangId).nama, g.jenis, g.qty, g.alasan, g.ket || '', g.user || '']); });
  unduh('laporan-' + R.a + (R.a !== R.b ? '_sd_' + R.b : '') + '.csv', '﻿' + rows.map(function (r2) { return r2.map(csvCell).join(';'); }).join('\r\n'), 'text/csv;charset=utf-8');
}

/* =====================================================================
   15. PENGGUNA
   ===================================================================== */
VIEWS.pengguna = {
  html: function () {
    var d = D();
    return '<div class="ph"><h1>Pengguna</h1><div class="acts"><button class="btn pri" type="button" data-act="user-tambah">+ Tambah Pengguna</button></div></div>' +
      '<div class="card"><div class="hint"><b>Pemilik</b> bisa mengakses semua menu. <b>Kasir</b> hanya Dashboard, Kasir, melihat Barang (tanpa harga modal), Transaksi miliknya, dan ganti password. Kasir lupa password? Klik <b>Edit</b> lalu isi password baru.</div><div class="tw"><table class="rt"><thead><tr><th>Nama</th><th>Username</th><th>Peran</th><th>Status</th><th>Aksi</th></tr></thead><tbody>' +
      d.users.map(function (u) {
        var me = u.id === S.user.id;
        return '<tr><td data-l="Nama"><b>' + esc(u.nama) + '</b>' + (me ? ' <span class="badge pri">Anda</span>' : '') + '</td><td data-l="Username">' + esc(u.username) + '</td><td data-l="Peran">' + (u.role === 'pemilik' ? 'Pemilik' : 'Kasir') + '</td>' +
          '<td data-l="Status">' + (u.aktif ? '<span class="badge ok">Aktif</span>' : '<span class="badge mut">Nonaktif</span>') + '</td><td class="acts-c"><button class="btn sm" type="button" data-act="user-edit" data-id="' + u.id + '">Edit</button>' +
          (me ? '' : '<button class="btn sm" type="button" data-act="user-toggle" data-id="' + u.id + '">' + (u.aktif ? 'Nonaktifkan' : 'Aktifkan') + '</button>') +
          (me ? '' : '<button class="btn sm bad" type="button" data-act="user-hapus" data-id="' + u.id + '">Hapus</button>') + '</td></tr>';
      }).join('') + '</tbody></table></div></div>';
  }
};
function formUser(u) {
  var edit = !!u; u = u || { nama: '', username: '', role: 'kasir' };
  var me = edit && u.id === S.user.id;
  openModal('<form data-form="user" data-id="' + (edit ? u.id : '') + '" novalidate><h3>' + (edit ? 'Edit Pengguna' : 'Tambah Pengguna') + '</h3>' +
    '<label class="fld"><span>Nama lengkap</span><input id="uNama" value="' + esc(u.nama) + '" autocomplete="off"></label>' +
    '<label class="fld"><span>Username</span><input id="uUser" value="' + esc(u.username) + '" autocomplete="off" autocapitalize="none"></label>' +
    '<label class="fld"><span>Peran</span><select id="uRole"' + (me ? ' disabled' : '') + '><option value="kasir"' + (u.role === 'kasir' ? ' selected' : '') + '>Kasir</option><option value="pemilik"' + (u.role === 'pemilik' ? ' selected' : '') + '>Pemilik</option></select></label>' +
    '<label class="fld"><span>' + (edit ? 'Password baru (kosongkan jika tidak diganti)' : 'Password (minimal 6 karakter)') + '</span><div class="pw"><input id="uPass" type="password" autocomplete="new-password"><button type="button" class="pw-eye" data-act="pw-eye" aria-label="Lihat atau sembunyikan password">Lihat</button></div></label>' +
    '<div class="msg err" id="uMsg"></div><div class="mbtn"><button class="btn" type="button" data-act="modal-close">Batal</button><button class="btn pri" type="submit" id="uSave">Simpan</button></div></form>');
}
function saveUser(form, btn) {
  var id = form.getAttribute('data-id'), d = D(), kodeBaru = null;
  var nama = $('#uNama').value.trim(), user = $('#uUser').value.trim().toLowerCase(), role = $('#uRole').value, pw = $('#uPass').value;
  var err = !nama ? 'Nama wajib diisi.' : !/^[a-z0-9._-]{3,}$/.test(user) ? 'Username minimal 3 karakter (huruf kecil, angka, titik, strip).' :
    d.users.some(function (x) { return x.id !== id && x.username.toLowerCase() === user; }) ? 'Username sudah dipakai.' :
      (!id && pw.length < 6) ? 'Password minimal 6 karakter.' : (id && pw && pw.length < 6) ? 'Password baru minimal 6 karakter.' : '';
  if (!err && id) {
    var cur = d.users.filter(function (x) { return x.id === id; })[0];
    if (cur.role === 'pemilik' && role !== 'pemilik' && d.users.filter(function (x) { return x.role === 'pemilik' && x.aktif; }).length < 2) err = 'Harus ada minimal satu pemilik aktif.';
  }
  if (err) { $('#uMsg').textContent = err; flash(btn, false); return; }
  if (id) {
    var u = d.users.filter(function (x) { return x.id === id; })[0];
    u.nama = nama; u.username = user; if (u.id !== S.user.id) u.role = role;
    if (pw) { u.salt = newSalt(); u.hash = hashPw(pw, u.salt); }
  } else {
    var s = newSalt(), nu = { id: uid(), nama: nama, username: user, role: role, aktif: true, salt: s, hash: hashPw(pw, s) };
    kodeBaru = newCode(); setRec(nu, kodeBaru); d.users.push(nu);
  }
  save(); btn.disabled = true; flash(btn, true, 'Tersimpan ✓', 600);
  setTimeout(function () { closeModal(); render(false); renderHeader(); toast('Pengguna disimpan.', 'ok'); if (kodeBaru) showKode(kodeBaru, nama); }, 550);
}

/* =====================================================================
   16. PENGATURAN, BACKUP, RESTORE
   ===================================================================== */
VIEWS.pengaturan = {
  html: function () {
    var d = D(), owner = isOwner(), kb = Math.round(JSON.stringify(d).length / 102.4) / 10;
    var h = '<div class="ph"><h1>Pengaturan</h1></div><div class="grid2">';
    if (owner) h += '<div class="card"><h2>Info toko &amp; nota</h2><form data-form="toko" novalidate><label class="fld"><span>Nama toko</span><input id="tNama" value="' + esc(d.toko.nama) + '"></label>' +
      '<label class="fld"><span>Alamat</span><input id="tAlamat" value="' + esc(d.toko.alamat) + '"></label><label class="fld"><span>Telepon</span><input id="tTelp" value="' + esc(d.toko.telp) + '"></label>' +
      '<label class="fld"><span>Catatan kaki nota</span><input id="tFooter" value="' + esc(d.toko.footer) + '"></label><div class="msg err" id="tMsg"></div><button class="btn pri" type="submit" id="tSave">Simpan</button></form></div>';
    h += '<div class="card"><h2>Ganti password saya</h2><form data-form="pw" novalidate><label class="fld"><span>Password lama</span><div class="pw"><input id="pLama" type="password" autocomplete="current-password"><button type="button" class="pw-eye" data-act="pw-eye" aria-label="Lihat atau sembunyikan password">Lihat</button></div></label>' +
      '<label class="fld"><span>Password baru (minimal 6 karakter)</span><div class="pw"><input id="pBaru" type="password" autocomplete="new-password"><button type="button" class="pw-eye" data-act="pw-eye" aria-label="Lihat atau sembunyikan password">Lihat</button></div></label><label class="fld"><span>Ulangi password baru</span><div class="pw"><input id="pBaru2" type="password" autocomplete="new-password"><button type="button" class="pw-eye" data-act="pw-eye" aria-label="Lihat atau sembunyikan password">Lihat</button></div></label>' +
      '<div class="msg err" id="pMsg"></div><button class="btn pri" type="submit" id="pSave">Ganti password</button></form></div>';
    h += '<div class="card"><h2>Kode pemulihan</h2><p class="mut" style="margin-top:0">Dipakai di layar masuk lewat <b>Lupa password</b>. ' + (S.user.rec ? 'Akun Anda sudah punya kode.' : '<b>Akun Anda belum punya kode.</b>') + ' Membuat kode baru membatalkan kode lama.</p><button class="btn pri" type="button" data-act="kode-baru">Buat kode pemulihan baru</button></div>';
    if (S.mode === 'real') h += '<div class="card"><h2>Hapus akun saya</h2><p class="mut" style="margin-top:0">Akun dihapus permanen dan Anda keluar. Riwayat transaksi tetap tersimpan atas nama Anda.' + (isOwner() ? ' Jika Anda satu-satunya pemilik, <b>seluruh data toko ikut dihapus</b> dan aplikasi kembali ke pengaturan awal.' : '') + '</p><button class="btn bad" type="button" data-act="akun-hapus">Hapus akun saya</button></div>';
    if (owner) {
      h += '<div class="card"><h2>Backup &amp; restore</h2><p class="mut" style="margin-top:0">Data tersimpan di browser komputer ini. Unduh backup secara berkala dan simpan di tempat aman (flashdisk, Google Drive).</p>' +
        '<div class="hint">' + (d.lastBackup ? 'Backup terakhir: <b>' + fdt(d.lastBackup) + '</b>' : '<b>Belum pernah backup.</b>') + '<br>Isi data: ' + d.barang.length + ' barang, ' + d.nota.length + ' nota, ' + d.gerak.length + ' catatan stok, ' + d.users.length + ' pengguna (' + kb + ' KB). Mode: <b>' + (S.mode === 'demo' ? 'DEMO' : 'DATA ASLI') + '</b></div>' +
        '<div class="tools"><button class="btn pri" type="button" data-act="backup">Unduh backup (.json)</button><button class="btn" type="button" data-act="restore-pick">Pulihkan dari backup</button></div></div>';
      h += '<div class="card"><h2>Zona berbahaya</h2>' + (S.mode === 'demo' ?
        '<p class="mut" style="margin-top:0">Mode demo memakai data contoh yang terpisah dari data asli.</p><div class="tools"><button class="btn" type="button" data-act="demo-reset">Reset data demo</button><button class="btn pri" type="button" data-act="mode-real">Pindah ke data asli</button></div>' :
        '<p class="mut" style="margin-top:0">Hapus semua barang, stok, dan transaksi (akun pengguna tetap). Unduh backup dulu.</p><div class="tools"><button class="btn bad" type="button" data-act="reset-data">Hapus semua data barang &amp; transaksi</button><button class="btn" type="button" data-act="mode-demo">Coba mode demo</button></div>') + '</div>';
    }
    return h + '</div>';
  }
};
function doBackup() {
  var d = D(); d.lastBackup = Date.now(); save();
  var o = { app: 'stok-warung', versi: 1, mode: S.mode, tanggal: new Date().toISOString(), data: d };
  var n = new Date();
  unduh('stok-warung-' + (S.mode === 'demo' ? 'DEMO-' : '') + 'backup-' + dkey(n.getTime()).replace(/-/g, '') + '-' + p2(n.getHours()) + p2(n.getMinutes()) + '.json', JSON.stringify(o, null, 1), 'application/json');
  toast('Backup diunduh. Simpan file ini di tempat aman.', 'ok');
  if (S.user && !$('#app').hidden) refresh();
}
function doRestoreFile(file) {
  var rd = new FileReader();
  rd.onerror = function () { toast('File tidak bisa dibaca.', 'err'); };
  rd.onload = function () {
    var o; try { o = JSON.parse(rd.result); } catch (e) { toast('File bukan backup yang valid (JSON rusak).', 'err'); return; }
    if (!o || o.app !== 'stok-warung' || !validDB(o.data)) { toast('File ini bukan backup Stok Warung.', 'err'); return; }
    if (o.mode !== S.mode) { toast('File ini backup ' + (o.mode === 'demo' ? 'DEMO' : 'DATA ASLI') + '. Tidak bisa dipulihkan ke mode ' + (S.mode === 'demo' ? 'DEMO' : 'DATA ASLI') + '.', 'err'); return; }
    if (!o.data.users.length) { toast('Backup tidak berisi akun pengguna.', 'err'); return; }
    var x = o.data;
    confirmBox({ judul: 'Pulihkan data dari backup?', bahaya: true, ya: 'Ya, ganti data',
      html: 'Backup tanggal <b>' + esc(o.tanggal ? fdt(new Date(o.tanggal).getTime()) : '-') + '</b> berisi ' + x.barang.length + ' barang, ' + x.nota.length + ' nota, ' + x.gerak.length + ' catatan stok.<br><br><b>Semua data saat ini akan diganti.</b> Pastikan sudah backup data sekarang.' }).then(function (ok) {
      if (!ok) return;
      setDB(normDB(x)); save();
      var still = S.user && D().users.filter(function (u) { return u.id === S.user.id && u.aktif; })[0];
      if (still) { S.user = still; render(false); toast('Data berhasil dipulihkan.', 'ok'); }
      else { S.user = null; ssSet(K_SESS, null); showAuth(); toast('Data dipulihkan. Silakan masuk dengan akun dari backup.', 'ok'); }
    });
  };
  rd.readAsText(file);
}

/* =====================================================================
   17. PENANGAN EVENT
   ===================================================================== */
var ACT = {
  'nav-toggle': function () { $('#nav').classList.toggle('open'); },
  'go': function () { $('#nav').classList.remove('open'); },
  'logout': function () { logout(); },
  'modal-close': function () { closeModal(); },
  'mode-demo': function () { switchMode('demo'); },
  'mode-real': function () { switchMode('real'); toast('Kembali ke data asli.', 'ok'); },
  'pw-eye': function (t) { var i = t.parentNode.querySelector('input'), show = i.type === 'password'; i.type = show ? 'text' : 'password'; t.textContent = show ? 'Sembunyi' : 'Lihat'; i.focus(); },
  'kode-salin': function (t) {
    var c = t.dataset.code;
    try { navigator.clipboard.writeText(c).then(function () { flash(t, true, 'Tersalin \u2713'); }, function () { flash(t, false, 'Salin manual'); }); } catch (e) { flash(t, false, 'Salin manual'); }
  },
  'pulih-akun': function () {
    openModal('<h3>Pulihkan akun</h3><p style="margin-top:0">Dipakai saat pindah komputer, data hilang, atau tidak bisa masuk sama sekali (mis. lupa password dan kode pemulihan).</p>' +
      '<div class="hint">Pilih file backup <b>.json</b> yang dulu diunduh dari <b>Pengaturan &gt; Unduh backup</b>. Seluruh data dan akun dikembalikan seperti saat backup dibuat, lalu masuk dengan username dan password saat itu.</div>' +
      '<div class="mbtn"><button class="btn" type="button" data-act="modal-close">Batal</button><button class="btn pri" type="button" data-act="restore-pick">Pilih file backup</button></div>');
  },
  'lupa': function () {
    openModal('<form data-form="lupa" novalidate><h3>Lupa password</h3><p style="margin-top:0" class="mut">Masukkan username dan <b>kode pemulihan</b> akun Anda (format XXXX-XXXX-XXXX), lalu buat password baru.</p>' +
      '<label class="fld"><span>Username</span><input id="fUser" autocomplete="username" autocapitalize="none"></label>' +
      '<label class="fld"><span>Kode pemulihan</span><input id="fKode" autocomplete="off" autocapitalize="characters" placeholder="XXXX-XXXX-XXXX"></label>' +
      pwField('fBaru', 'Password baru (minimal 6 karakter)', 'new-password') + pwField('fBaru2', 'Ulangi password baru', 'new-password') +
      '<div class="msg err" id="fMsg"></div>' +
      '<div class="hint">Tidak punya kode? <b>Kasir</b>: minta pemilik reset di menu Pengguna. <b>Pemilik</b>: pakai <b>Pulihkan akun</b> dengan file backup.</div>' +
      '<div class="mbtn"><button class="btn" type="button" data-act="modal-close">Batal</button><button class="btn pri" type="submit" id="fSave">Ganti password</button></div></form>');
  },
  'kode-baru': function () {
    openModal('<form data-form="kode" novalidate><h3>Buat kode pemulihan baru</h3><p style="margin-top:0" class="mut">Kode lama tidak berlaku lagi. Masukkan password Anda untuk melanjutkan.</p>' + pwField('kPw', 'Password saya', 'current-password') +
      '<div class="msg err" id="kMsg2"></div><div class="mbtn"><button class="btn" type="button" data-act="modal-close">Batal</button><button class="btn pri" type="submit" id="kSave">Buat kode</button></div></form>');
  },
  'akun-hapus': function () {
    var last = S.user.role === 'pemilik' && D().users.filter(function (x) { return x.role === 'pemilik' && x.aktif; }).length < 2;
    openModal('<form data-form="hapusakun" data-last="' + (last ? '1' : '') + '" novalidate><h3>Hapus akun saya?</h3>' +
      (last ? '<div class="hint warn"><b>Anda satu-satunya pemilik.</b> Menghapus akun ini akan menghapus <b>seluruh data toko</b> (barang, stok, transaksi, pengguna lain). Unduh backup dulu di Pengaturan jika masih perlu.</div>' : '<p style="margin-top:0" class="mut">Akun <b>' + esc(S.user.nama) + '</b> dihapus permanen.</p>') +
      pwField('hPw', 'Password saya', 'current-password') + (last ? '<label class="fld"><span>Ketik HAPUS untuk konfirmasi</span><input id="hKonf" autocomplete="off" placeholder="HAPUS"></label>' : '') +
      '<div class="msg err" id="hMsg"></div><div class="mbtn"><button class="btn" type="button" data-act="modal-close">Batal</button><button class="btn bad solid" type="submit" id="hSave">Hapus akun</button></div></form>');
  },
  'restore-pick': function () { $('#fileRestore').value = ''; $('#fileRestore').click(); },
  'backup': function () { doBackup(); },
  'barang-tambah': function () { formBarang(null); },
  'barang-edit': function (t) { formBarang(barangById(t.dataset.id)); },
  'barang-hapus': function (t) { hapusBarang(t.dataset.id); },
  'barang-aktif': function (t) { var b = barangById(t.dataset.id); b.arsip = false; save(); refresh(); toast('Barang diaktifkan lagi.', 'ok'); },
  'stok-cepat': function (t) { S.stokPre = t.dataset.id; S.stokMode = 'masuk'; location.hash = '#stok'; if (S.view === 'stok') render(true); },
  'u-add': function () { $('#mUnits').insertAdjacentHTML('beforeend', unitRowHTML(null, $('#mSatuan').value.trim() || 'pcs')); var n = $$('#mUnits .u-nama'); n[n.length - 1].focus(); },
  'u-del': function (t) { t.closest('.urow').remove(); rebuildStokAwal(); modalHint(); },
  'smode': function (t) { S.stokMode = t.dataset.v; $$('#sSeg button').forEach(function (b) { b.classList.toggle('on', b === t); }); stokPilih(); $('#sMsg').textContent = ''; },
  'kmode': function (t) {
    S.kmode = t.dataset.v; $$('[data-act=kmode]').forEach(function (b) { b.classList.toggle('on', b === t); });
    $('#kGrosirW').hidden = S.kmode !== 'grosir'; $('#kMode').textContent = S.kmode === 'grosir' ? '(harga grosir)' : '(harga eceran)';
    renderPList(); renderCart();
  },
  'add': function (t) { addToCart(t.dataset.id); },
  'del': function (t) { S.cart.splice(+t.dataset.i, 1); renderCart(); },
  'ke-keranjang': function () { var e = $('#kCartCard'); if (e) e.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
  'kosong': function () { if (!S.cart.length) return; S.cart = []; renderCart(); },
  'quick': function (t) { S.k.bayar = +t.dataset.v; setMoney($('#kBayar'), S.k.bayar); renderTotals(); },
  'bayar': function (t) { bayar(t); },
  'nota-lihat': function (t, e) { e.preventDefault(); var n = D().nota.filter(function (x) { return x.id === t.dataset.id; })[0]; if (n) showNota(n, false); },
  'nota-print': function (t) { var n = D().nota.filter(function (x) { return x.id === t.dataset.id; })[0]; if (n) cetak(notaHTML(n)); },
  'nota-batal': function (t) {
    var n = D().nota.filter(function (x) { return x.id === t.dataset.id; })[0]; if (!n || n.batal) return;
    confirmBox({ judul: 'Batalkan nota ' + n.no + '?', bahaya: true, ya: 'Ya, batalkan', html: 'Nota dibatalkan dan <b>stok barang dikembalikan</b>. Nota tidak masuk laporan penjualan. Tindakan ini tidak bisa dibatalkan.' }).then(function (ok) {
      if (!ok) return; batalNota(n, ''); save(); refresh(); toast('Nota dibatalkan, stok dikembalikan.', 'ok');
    });
  },
  'lap-tipe': function (t) { S.lap.tipe = t.dataset.v; render(false); },
  'lap-set': function (t) {
    var L = S.lap, v = t.dataset.v, tk = today();
    if (v === 'hari') L.tgl = tk; else if (v === 'kemarin') L.tgl = addDays(tk, -1);
    else if (v === 'bulan') L.bln = tk.slice(0, 7);
    else if (v === 'bulanlalu') { var a = tk.slice(0, 7).split('-'); var dd = new Date(+a[0], +a[1] - 2, 1); L.bln = dd.getFullYear() + '-' + p2(dd.getMonth() + 1); }
    else if (v === '7hari') { L.dari = addDays(tk, -6); L.sampai = tk; } else if (v === '30hari') { L.dari = addDays(tk, -29); L.sampai = tk; }
    render(false);
  },
  'lap-print': function () { var R = lapRange(); cetak('<div class="rpt">' + $('#lapArea').innerHTML + '</div>'); void R; },
  'lap-csv': function () { lapCSV(); },
  'user-tambah': function () { formUser(null); },
  'user-edit': function (t) { formUser(D().users.filter(function (u) { return u.id === t.dataset.id; })[0]); },
  'user-toggle': function (t) {
    var u = D().users.filter(function (x) { return x.id === t.dataset.id; })[0];
    if (u.aktif && u.role === 'pemilik' && D().users.filter(function (x) { return x.role === 'pemilik' && x.aktif; }).length < 2) { toast('Harus ada minimal satu pemilik aktif.', 'err'); return; }
    u.aktif = !u.aktif; save(); render(false); toast(u.aktif ? 'Pengguna diaktifkan.' : 'Pengguna dinonaktifkan.', 'ok');
  },
  'user-hapus': function (t) {
    var u = D().users.filter(function (x) { return x.id === t.dataset.id; })[0]; if (!u) return;
    if (u.role === 'pemilik' && D().users.filter(function (x) { return x.role === 'pemilik' && x.aktif && x.id !== u.id; }).length < 1) { toast('Harus ada minimal satu pemilik aktif.', 'err'); return; }
    confirmBox({ judul: 'Hapus pengguna?', bahaya: true, ya: 'Hapus', html: 'Akun <b>' + esc(u.nama) + '</b> dihapus. Riwayat transaksi lama tetap tersimpan dengan nama kasir.' }).then(function (ok) {
      if (!ok) return; D().users = D().users.filter(function (x) { return x.id !== u.id; }); save(); render(false); toast('Pengguna dihapus.', 'ok');
    });
  },
  'reset-data': function () {
    openModal('<h3>Hapus semua data?</h3><p>Semua barang, stok, dan transaksi akan dihapus permanen. Akun pengguna tetap ada. Ketik <b>HAPUS</b> untuk melanjutkan.</p>' +
      '<input id="rKonf" class="inp" autocomplete="off" placeholder="HAPUS"><div class="msg err" id="rMsg"></div><div class="mbtn"><button class="btn" type="button" data-act="modal-close">Batal</button><button class="btn bad solid" type="button" data-act="reset-ok" id="rOk">Hapus semua</button></div>');
  },
  'reset-ok': function (t) {
    if ($('#rKonf').value.trim() !== 'HAPUS') { $('#rMsg').textContent = 'Ketik HAPUS (huruf besar) untuk konfirmasi.'; flash(t, false, 'Gagal ✕'); return; }
    var d = D(); d.barang = []; d.gerak = []; d.nota = []; save(); closeModal(); S.cart = []; refresh(); toast('Semua data barang & transaksi dihapus.', 'ok');
  },
  'demo-reset': function () {
    confirmBox({ judul: 'Reset data demo?', ya: 'Reset', html: 'Data demo dikembalikan ke contoh awal. Data asli toko tidak terpengaruh.' }).then(function (ok) {
      if (!ok) return; var db = seedDemo(); setDB(db); save(); logout(); toast('Data demo direset. Masuk lagi.', 'ok');
    });
  }
};
document.addEventListener('click', function (e) {
  if (e.target.id === 'overlay') { closeModal(); return; }
  var t = e.target.closest('[data-act]'); if (!t) return;
  var a = t.getAttribute('data-act');
  if (ACT[a]) { ACT[a](t, e); }
});
document.addEventListener('submit', function (e) {
  var f = e.target.closest('form[data-form]'); if (!f) return;
  e.preventDefault();
  var btn = f.querySelector('button[type=submit]'); if (btn && btn.disabled) return;
  var n = f.getAttribute('data-form');
  if (n === 'login') doLogin(btn);
  else if (n === 'setup') doSetup(btn);
  else if (n === 'barang') saveBarang(f, btn);
  else if (n === 'stok') saveStok(btn);
  else if (n === 'user') saveUser(f, btn);
  else if (n === 'lupa') doLupa(btn);
  else if (n === 'kode') doKode(btn);
  else if (n === 'hapusakun') doHapusAkun(f, btn);
  else if (n === 'toko') {
    var nama = $('#tNama').value.trim(); if (!nama) { $('#tMsg').textContent = 'Nama toko wajib diisi.'; flash(btn, false); return; }
    var t = D().toko; t.nama = nama; t.alamat = $('#tAlamat').value.trim(); t.telp = $('#tTelp').value.trim(); t.footer = $('#tFooter').value.trim();
    save(); $('#tMsg').textContent = ''; flash(btn, true, 'Tersimpan ✓'); renderHeader();
  } else if (n === 'pw') {
    var lama = $('#pLama').value, baru = $('#pBaru').value, b2 = $('#pBaru2').value, m = $('#pMsg');
    var er = hashPw(lama, S.user.salt) !== S.user.hash ? 'Password lama salah.' : baru.length < 6 ? 'Password baru minimal 6 karakter.' : baru !== b2 ? 'Ulangi password baru tidak sama.' : '';
    if (er) { m.textContent = er; flash(btn, false); return; }
    S.user.salt = newSalt(); S.user.hash = hashPw(baru, S.user.salt); save(); m.textContent = '';
    $('#pLama').value = $('#pBaru').value = $('#pBaru2').value = ''; flash(btn, true, 'Password diganti ✓'); toast('Password berhasil diganti.', 'ok');
  }
});
document.addEventListener('input', function (e) {
  var t = e.target;
  if (t.classList.contains('money')) {
    fmtMoneyEl(t);
    if (t.id === 'kBayar') { S.k.bayar = pnum(t.value); renderTotals(); }
    else if (t.id === 'sHarga') stokHitung();
    else if (t.closest('#modal') && t.id.indexOf('m') === 0) modalHint();
    return;
  }
  var id = t.id;
  if (id === 'bSearch') { barangUI.q = t.value; renderBarangRows(); }
  else if (id === 'kSearch') renderPList();
  else if (id === 'kPembeli') S.k.pembeli = t.value;
  else if (id === 'kDiskon') { S.k.diskon = t.value; renderTotals(); }
  else if (id === 'rQ') { S.riw.q = t.value; renderRiwayat($('#rList'), S.riw, true); }
  else if (id === 'tQ') { S.trx.q = t.value; renderTrx(); }
  else if (t.classList.contains('qi')) { if ($('#sQty') && $('#sQty').contains(t)) stokHitung(); else updStokAwalTot(); }
  else if (t.classList.contains('u-nama')) {
    var row = t.closest('.urow'), isi = row.querySelector('.u-isi');
    if (!isi.dataset.manual) { var p = D().presets[t.value.trim().toLowerCase()]; isi.value = p || ''; }
    rebuildStokAwal(); modalHint();
  } else if (t.classList.contains('u-isi')) { t.dataset.manual = '1'; rebuildStokAwal(); modalHint(); }
  else if (id === 'mSatuan') { $$('#mUnits .u-sat').forEach(function (x) { x.textContent = t.value.trim() || 'pcs'; }); rebuildStokAwal(); modalHint(); }
});
document.addEventListener('change', function (e) {
  var t = e.target, id = t.id;
  /* lepas fokus dulu agar render ulang tidak memicu 'change' susulan di tengah proses */
  if (document.activeElement === t && t.matches && t.matches('.c-qty,.c-unit,#lTgl,#lBln,#lDari,#lSampai')) { t.blur(); }
  if (id === 'bFilter') { barangUI.f = t.value; renderBarangRows(); }
  else if (id === 'bArsip') { barangUI.arsip = t.checked; renderBarangRows(); }
  else if (id === 'sBarang') stokPilih();
  else if (id === 'rJenis') { S.riw.jenis = t.value; renderRiwayat($('#rList'), S.riw, true); }
  else if (id === 'rDari' || id === 'rSampai') { S.riw[id === 'rDari' ? 'dari' : 'sampai'] = t.value; renderRiwayat($('#rList'), S.riw, true); }
  else if (id === 'tDari' || id === 'tSampai' || id === 'tMode' || id === 'tStatus') { S.trx[{ tDari: 'dari', tSampai: 'sampai', tMode: 'mode', tStatus: 'status' }[id]] = t.value; renderTrx(); }
  else if (id === 'lTgl') { if (t.value) { S.lap.tgl = t.value; render(false); } }
  else if (id === 'lBln') { if (t.value) { S.lap.bln = t.value; render(false); } }
  else if (id === 'lDari' || id === 'lSampai') { if (t.value) { S.lap[id === 'lDari' ? 'dari' : 'sampai'] = t.value; render(false); } }
  else if (id === 'fileRestore') { if (t.files && t.files[0]) doRestoreFile(t.files[0]); }
  else if (t.classList.contains('c-qty')) {
    var c = S.cart[+t.getAttribute('data-i')]; if (!c) return;
    var v = Number(t.value); if (!(v >= 1) || Math.floor(v) !== v) { toast('Jumlah harus bilangan bulat minimal 1.', 'warn'); v = Math.max(1, Math.floor(v) || 1); }
    c.jumlah = v; renderCart();
  } else if (t.classList.contains('c-unit')) {
    var c2 = S.cart[+t.getAttribute('data-i')]; if (!c2) return;
    var dup = S.cart.filter(function (x, i) { return i !== +t.getAttribute('data-i') && x.barangId === c2.barangId && x.unit === t.value; })[0];
    if (dup) { dup.jumlah += c2.jumlah; S.cart.splice(+t.getAttribute('data-i'), 1); } else c2.unit = t.value;
    renderCart();
  }
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && !$('#overlay').hidden) closeModal();
});
window.addEventListener('storage', function (e) {
  if (e.key !== KEYS[S.mode] || !S.user) return;
  var db = loadMode(S.mode); if (!db) return;
  setDB(db); var u = db.users.filter(function (x) { return x.id === S.user.id && x.aktif; })[0];
  if (!u) { logout(); return; } S.user = u;
  if (!$('#overlay').hidden) return;
  if (['kasir', 'stok', 'pengguna', 'pengaturan'].indexOf(S.view) < 0) refresh();
});

/* =====================================================================
   18. MULAI
   ===================================================================== */
function cekCss() {
  var ok = false;
  try { ok = getComputedStyle(document.documentElement).getPropertyValue('--pri').trim() !== ''; } catch (e) { }
  if (ok) return;
  var d = document.createElement('div');
  d.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:999;background:#fde8e8;color:#9c1f1f;padding:12px 14px;font:600 14px/1.4 sans-serif;text-align:center';
  d.textContent = 'Tampilan belum termuat: file style.css tidak ditemukan. Buka index.html dari folder yang berisi style.css dan fonts.css, atau pakai file stok-warung-satu-file.html.';
  document.body.appendChild(d);
}
function boot() {
  var bm = document.getElementById('bootMsg'); if (bm) bm.parentNode.removeChild(bm);
  cekCss();
  initData();
  restoreSession();
  if (S.user) enterApp(); else showAuth();
}
window.__sw = { S: S, calc: calc, stok: stok, sha256: sha256 };
boot();
})();
