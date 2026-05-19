// ─── rk-map — Interactive map (Leaflet CDN) ─────────────────────

type LeafletModule = {
  map: (el: HTMLElement, opts?: Record<string, unknown>) => LeafletMap;
  tileLayer: (url: string, opts?: Record<string, unknown>) => LeafletTileLayer;
  marker: (latlng: [number, number], opts?: Record<string, unknown>) => LeafletMarker;
  icon: (opts: {
    iconUrl: string;
    shadowUrl?: string;
    iconSize: [number, number];
    iconAnchor: [number, number];
    popupAnchor: [number, number];
  }) => unknown;
};

interface LeafletMap {
  setView: (center: [number, number], zoom: number) => LeafletMap;
  remove: () => void;
  invalidateSize: () => void;
}

interface LeafletTileLayer {
  addTo: (map: LeafletMap) => LeafletTileLayer;
}

interface LeafletMarker {
  addTo: (map: LeafletMap) => LeafletMarker;
  bindPopup: (html: string, opts?: Record<string, unknown>) => LeafletMarker;
}

interface MapMarker {
  lat: number;
  lng: number;
  label?: string;
  color?: string;
}

const TILE_URLS: Record<string, string> = {
  osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  'carto-light': 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  'carto-dark': 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
};

const TILE_ATTRIBUTIONS: Record<string, string> = {
  osm: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  'carto-light': '&copy; <a href="https://carto.com/">CARTO</a>',
  'carto-dark': '&copy; <a href="https://carto.com/">CARTO</a>',
};

class RkMap extends HTMLElement {
  _map: LeafletMap | null = null;
  _raw = '';
  _rawCaptured = false;
  _uid = Math.random().toString(36).slice(2, 9);
  _renderSeq = 0;

  static get observedAttributes() {
    return ['center', 'zoom', 'height', 'title', 'tiles'];
  }

  
connectedCallback(): void {
    if (this._rawCaptured) {
      this._render();
      return;
    }
    window.setTimeout(() => {
      if (!this.isConnected || this._rawCaptured) return;
      this._raw = (this.textContent || '').trim();
      this._rawCaptured = true;
      this._render();
    }, 0);
  }

  disconnectedCallback(): void {
    if (this._map) {
      this._map.remove();
      this._map = null;
    }
  }

  attributeChangedCallback(): void {
    if (!this.isConnected || !this._rawCaptured) return;
    if (this._map) {

      this._map = null;
    }
    this._render();
  }

  _parseCenter(): [number, number] {
    const raw = this.getAttribute('center') || '30,105';
    const parts = raw.split(',').map(Number);
    const lat = isNaN(parts[0]) ? 30 : parts[0];
    const lng = isNaN(parts[1]) ? 105 : parts[1];
    return [lat, lng];
  }

  _parseMarkers(): MapMarker[] {
    if (!this._raw) return [];
    try {
      const data = JSON.parse(this._raw);
      if (!Array.isArray(data)) return [];
      return data.filter(
        (m: unknown) =>
          typeof m === 'object' &&
          m !== null &&
          typeof (m as MapMarker).lat === 'number' &&
          typeof (m as MapMarker).lng === 'number',
      ) as MapMarker[];
    } catch {
      return [];
    }
  }

  _escape(s: string): string {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  _injectLeafletCSS(): void {
    if (document.querySelector('link[data-rk-leaflet-css]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css';
    link.setAttribute('data-rk-leaflet-css', '');
    document.head.appendChild(link);
  }

  async _render(): Promise<void> {
    const seq = ++this._renderSeq;
    if (this._map) {
      this._map.remove();
      this._map = null;
    }

    const center = this._parseCenter();
    const zoom = parseInt(this.getAttribute('zoom') || '4', 10) || 4;
    const height = parseInt(this.getAttribute('height') || '400', 10) || 400;
    const title = this.getAttribute('title') || '';
    const tiles = this.getAttribute('tiles') || 'osm';
    const markers = this._parseMarkers();
    const tileUrl = TILE_URLS[tiles] || TILE_URLS.osm;
    const tileAttr = TILE_ATTRIBUTIONS[tiles] || TILE_ATTRIBUTIONS.osm;

    const containerId = `rk-map-${this._uid}`;
    this.innerHTML = `
      <div class="rk-map">
        ${title ? `<div class="rk-map__title">${this._escape(title)}</div>` : ''}
        <div class="rk-map__container" id="${containerId}" style="height:${height}px;width:100%;"></div>
        ${markers.length > 0 ? `<div class="rk-map__info">${markers.length} marker${markers.length > 1 ? 's' : ''}</div>` : ''}
      </div>`;

    this._injectLeafletCSS();

    try {
      const L = (await import(
        /* @vite-ignore */
        'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet-src.esm.js'
      )) as unknown as LeafletModule;

      if (seq !== this._renderSeq) return;

      const container = this.querySelector(`#${containerId}`) as HTMLElement;
      if (!container) return;

      const map = L.map(container, {
        scrollWheelZoom: true,
        zoomControl: true,
      }).setView(center, zoom);

      L.tileLayer(tileUrl, {
        attribution: tileAttr,
        maxZoom: 19,
      }).addTo(map);

      // Fit bounds if multiple markers
      if (markers.length > 1) {
        for (const m of markers) {
          const mk = L.marker([m.lat, m.lng]);
          if (m.label) {
            mk.bindPopup(this._escape(m.label), { closeButton: false });
          }
          mk.addTo(map);
        }
        // Auto-fit bounds
        const bounds = markers.map((m) => [m.lat, m.lng] as [number, number]);
        map.setView(
          [
            (Math.min(...bounds.map((b) => b[0])) + Math.max(...bounds.map((b) => b[0]))) / 2,
            (Math.min(...bounds.map((b) => b[1])) + Math.max(...bounds.map((b) => b[1]))) / 2,
          ],
          zoom,
        );
      } else if (markers.length === 1) {
        const m = markers[0];
        const mk = L.marker([m.lat, m.lng]);
        if (m.label) {
          mk.bindPopup(this._escape(m.label), { closeButton: false });
        }
        mk.addTo(map);
        map.setView([m.lat, m.lng], Math.max(zoom, 10));
      }

      // Leaflet needs invalidateSize after DOM render
      requestAnimationFrame(() => {
        map.invalidateSize();
      });

      this._map = map;
    } catch (err) {
      const container = this.querySelector(`#${containerId}`);
      if (container) {
        container.innerHTML = `<div class="rk-map__error">Map load failed: ${(err as Error).message}</div>`;
      }
    }
  }
}

customElements.define('rk-map', RkMap);
export { RkMap };
