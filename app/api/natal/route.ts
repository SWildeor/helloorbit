import swe from "swisseph";
import { find as geoTzFind } from "geo-tz";
import { DateTime } from "luxon";
import { createClient } from "@supabase/supabase-js";

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
    const { year, month, day, hour, minute, lat, lng, accessToken } = await req.json();

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
    const mercury = calcPlanet(swe.SE_MERCURY);
    const venus = calcPlanet(swe.SE_VENUS);
    const mars = calcPlanet(swe.SE_MARS);
    const jupiter = calcPlanet(swe.SE_JUPITER);
    const saturn = calcPlanet(swe.SE_SATURN);
    const uranus = calcPlanet(swe.SE_URANUS);
    const neptune = calcPlanet(swe.SE_NEPTUNE);
    const pluto = calcPlanet(swe.SE_PLUTO);
    const trueNode = calcPlanet(swe.SE_TRUE_NODE);

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
      rising ? `s/${rising.sign}Rising` : `s/UnknownRising`,
      rising
        ? `s/${sun.sign}Sun${moon.sign}Moon${rising.sign}Rising`
        : `s/${sun.sign}Sun${moon.sign}MoonUnknownRising`,
    ];

    console.log("[natal] accessToken present:", !!accessToken);

    if (accessToken) {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
        );

        const { data: { user } } = await supabase.auth.getUser();
        console.log("[natal] user found:", user ? user.id : null);

        if (user) {
          const mm = String(month).padStart(2, "0");
          const dd = String(day).padStart(2, "0");

          const { data: chartRow, error: chartError } = await supabase
            .from("natal_charts")
            .upsert({
              user_id: user.id,
              birth_date: `${year}-${mm}-${dd}`,
              birth_time: timeUnknown
                ? null
                : `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`,
              birth_time_unknown: timeUnknown,
              birth_place: null,
              birth_lat: lat,
              birth_lng: lng,
              sun_sign: sun.sign,
              moon_sign: moon.sign,
              rising_sign: rising?.sign ?? null,
              midheaven: mcPos?.sign ?? null,
              all_placements: {
                mercury: mercury.sign,
                venus: venus.sign,
                mars: mars.sign,
                jupiter: jupiter.sign,
                saturn: saturn.sign,
                uranus: uranus.sign,
                neptune: neptune.sign,
                pluto: pluto.sign,
                true_node: trueNode.sign,
              },
            }, { onConflict: "user_id" })
            .select()
            .single();

          if (chartError) {
            console.error("[natal] chartError message:", chartError.message);
            console.error("[natal] chartError code:", chartError.code);
            console.error("[natal] chartError details:", chartError.details);
            console.error("[natal] chartError hint:", chartError.hint);
          } else if (chartRow) {
            console.log("[natal] natal_charts upsert succeeded, id:", chartRow.id);

            const sphereRows = spheres.map((sphere_name) => ({
              user_id: user.id,
              natal_chart_id: chartRow.id,
              sphere_name,
            }));

            const { error: sphereError } = await supabase
              .from("sphere_memberships")
              .upsert(sphereRows, { onConflict: "user_id,sphere_name" });

            if (sphereError) {
              console.error("[natal] sphere_memberships error:", sphereError.message, sphereError.code, sphereError.details, sphereError.hint);
            } else {
              console.log("[natal] sphere_memberships upsert succeeded");
            }
          }
        }
      } catch (saveErr) {
        console.error("Supabase save error:", saveErr);
      }
    }

    return Response.json({
      sun,
      moon,
      rising,
      mc: mcPos,
      mercury,
      venus,
      mars,
      jupiter,
      saturn,
      uranus,
      neptune,
      pluto,
      chiron: { sign: "Coming soon", degree: null },
      trueNode,
      spheres,
    });
  } catch (err) {
    console.error("Natal chart error:", err);
    return Response.json({ error: "Failed to calculate natal chart" }, { status: 500 });
  }
}
