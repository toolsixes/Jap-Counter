/**
 * Universal WebGL Polyfill / Safeguard for Mobile Browsers & WebViews
 * Prevents "TypeError: null is not an object (evaluating 'gl.getShaderPrecisionFormat(...).precision')"
 * on Android Edge, Safari, Samsung Internet, and embedded WebViews.
 */

const fallbackPrecision: WebGLShaderPrecisionFormat = {
  rangeMin: 1,
  rangeMax: 1,
  precision: 23,
};

function patchPrecision(target: any) {
  if (!target) return;
  const proto = target.prototype || target;
  if (!proto) return;

  const original = proto.getShaderPrecisionFormat;
  if (typeof original === 'function') {
    proto.getShaderPrecisionFormat = function (shaderType: number, precisionType: number) {
      try {
        const result = original.call(this, shaderType, precisionType);
        if (result && typeof result.precision === 'number' && result.precision > 0) {
          return result;
        }
        return fallbackPrecision;
      } catch {
        return fallbackPrecision;
      }
    };
  } else {
    proto.getShaderPrecisionFormat = function () {
      return fallbackPrecision;
    };
  }
}

if (typeof window !== 'undefined') {
  try {
    // 1. WebGLRenderingContextBase is the root in Chromium, WebKit, and Edge
    if ((window as any).WebGLRenderingContextBase) {
      patchPrecision((window as any).WebGLRenderingContextBase);
    }
    // 2. WebGLRenderingContext
    if (typeof WebGLRenderingContext !== 'undefined') {
      patchPrecision(WebGLRenderingContext);
    }
    // 3. WebGL2RenderingContext
    if (typeof WebGL2RenderingContext !== 'undefined') {
      patchPrecision(WebGL2RenderingContext);
    }
  } catch (e) {
    console.warn('WebGL polyfill registration warning:', e);
  }
}

export function ensureSafeContext(gl: WebGLRenderingContext | WebGL2RenderingContext | null) {
  if (!gl) return;
  try {
    const orig = gl.getShaderPrecisionFormat ? gl.getShaderPrecisionFormat.bind(gl) : null;
    gl.getShaderPrecisionFormat = function (shaderType: number, precisionType: number) {
      if (orig) {
        try {
          const res = orig(shaderType, precisionType);
          if (res && typeof res.precision === 'number' && res.precision > 0) {
            return res;
          }
        } catch {
          // ignore error and return fallback
        }
      }
      return fallbackPrecision;
    };
  } catch {
    // ignore
  }
}
