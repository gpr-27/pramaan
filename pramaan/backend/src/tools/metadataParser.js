import exifr from 'exifr';

const EDITING_SOFTWARE = ['capcut', 'adobe', 'photoshop', 'lightroom', 'snapseed', 'facetune', 'meitu', 'retouch', 'picsart', 'vsco', 'dall-e', 'midjourney', 'stable diffusion', 'firefly'];

export async function parseMetadata(filePath) {
  try {
    const exif = await exifr.parse(filePath, {
      gps: true,
      tiff: true,
      exif: true,
      iptc: true,
      icc: false,
      jfif: false,
      sanitize: false,
      mergeOutput: true,
    });

    if (!exif) {
      return {
        gps: null,
        device: null,
        software: null,
        timestamp: null,
        anomalies: ['No metadata found — metadata may have been stripped'],
        raw: {},
      };
    }

    const gps = exif.latitude && exif.longitude
      ? { lat: exif.latitude, lng: exif.longitude }
      : null;

    const device = [exif.Make, exif.Model].filter(Boolean).join(' ') || null;
    const software = exif.Software || null;
    const timestamp = exif.DateTimeOriginal || exif.DateTime || null;

    const anomalies = [];

    if (!gps) anomalies.push('GPS data absent — location cannot be verified from metadata');
    if (!device) anomalies.push('Device info missing — camera/phone model stripped');
    if (!timestamp) anomalies.push('Timestamp missing — creation time unknown');

    if (software) {
      const softwareLower = software.toLowerCase();
      for (const tool of EDITING_SOFTWARE) {
        if (softwareLower.includes(tool)) {
          anomalies.push(`Editing software detected: "${software}"`);
          break;
        }
      }
    }

    // Check for timestamp inconsistencies
    if (exif.DateTimeOriginal && exif.DateTime) {
      const original = new Date(exif.DateTimeOriginal).getTime();
      const modified = new Date(exif.DateTime).getTime();
      if (Math.abs(original - modified) > 3600000) {
        anomalies.push('Timestamp mismatch between original and modified dates');
      }
    }

    return {
      gps,
      device,
      software,
      timestamp: timestamp ? String(timestamp) : null,
      anomalies,
      raw: {
        make: exif.Make,
        model: exif.Model,
        software: exif.Software,
        dateTimeOriginal: exif.DateTimeOriginal,
        dateTime: exif.DateTime,
        xResolution: exif.XResolution,
        yResolution: exif.YResolution,
        colorSpace: exif.ColorSpace,
      },
    };
  } catch (err) {
    console.error('[metadataParser] Error:', err.message);
    return {
      gps: null,
      device: null,
      software: null,
      timestamp: null,
      anomalies: ['Metadata parsing failed — file may be corrupted or unsupported format'],
      raw: {},
    };
  }
}
