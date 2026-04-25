import swe from "swisseph";
import { find as geoTzFind } from "geo-tz";
import { DateTime } from "luxon";

const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer",
  "Leo", "Virgo", "Libra", "Scorpio",
  "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

function toZodiac(longitude: number): { sign: string; degree: number } {
  const norm = ((longitude % 360) + 360) % 360;
  return {
    sign: SIGNS[Math.floor(norm / 30)],
    degree: Math.floor(norm % 30),
  };
}

export async function POST(req: Request) {
  try {
    const { year, month, day, hour, minute, lat, lng } = await req.json();

    const timeUnknown = hour === null || minute === null;

    let jd: number;
    if (timeUnknown) {
      const jdResult = swe.swe_utc_to_jd(year, month, day, 12, 0, 0, swe.SE_GREG_CAL);
      if ("error" in jdResult) throw new Error(jdResult.error);
      jd = jdResult.julianDayUT;
    } else {
      const timezones = geoTzFind(lat, lng);
      if (!timezones.length) throw new Error("Could not determine timezone");

      const localDt = DateTime.fromObject(
        { year, month, day, hour, minute },
        { zone: timezones[0] }
      );
      const utc = localDt.toUTC();

      const jdResult = swe.swe_utc_to_jd(
        utc.year, utc.month, utc.day,
        utc.hour, utc.minute, utc.second,
        swe.SE_GREG_CAL
      );
      if ("error" in jdResult) throw new Error(jdResult.error);
      jd = jdResult.julianDayUT;
    }

    const flags = swe.SEFLG_SPEED | swe.SEFLG_SWIEPH;

    function calcPlanet(body: number) {
      const result = swe.swe_calc_ut(jd, body, flags);
      if ("error" in result) throw new Error((result as { error: string }).error);
      return toZodiac((result as { longitude: number }).longitude);
    }

    const sun = calcPlanet(swe.SE_SUN);
    const moon = calcPlanet(swe.SE_MOON);

    let rising: { sign: string; degree: number } | null = null;
    let mcPos: { sign: string; degree: number } | null = null;

    if (!timeUnknown) {
      const housesResult = swe.swe_houses(jd, lat, lng, "P");
      if ("error" in housesResult) throw new Error((housesResult as { error: string }).error);
      const { ascendant, mc } = housesResult as { ascendant: number; mc: number };
      rising = toZodiac(ascendant);
      mcPos = toZodiac(mc);
    }

    const spheres = [
      `s/${sun.sign}Sun`,
      `s/${moon.sign}Moon`,
      rising
        ? `s/${rising.sign}Rising`
        : `s/UnknownRising`,
      rising
        ? `s/${sun.sign}Sun${moon.sign}Moon${rising.sign}Rising`
        : `s/${sun.sign}Sun${moon.sign}MoonUnknownRising`,
    ];

    return Response.json({
      sun,
      moon,
      rising,
      mc: mcPos,
      mercury: calcPlanet(swe.SE_MERCURY),
      venus: calcPlanet(swe.SE_VENUS),
      mars: calcPlanet(swe.SE_MARS),
      jupiter: calcPlanet(swe.SE_JUPITER),
      saturn: calcPlanet(swe.SE_SATURN),
      uranus: calcPlanet(swe.SE_URANUS),
      neptune: calcPlanet(swe.SE_NEPTUNE),
      pluto: calcPlanet(swe.SE_PLUTO),
      chiron: { sign: "Coming soon", degree: null },
      trueNode: calcPlanet(swe.SE_TRUE_NODE),
      spheres,
    });
  } catch (err) {
    console.error("Natal chart error:", err);
    return Response.json({ error: "Failed to calculate natal chart" }, { status: 500 });
  }
}
