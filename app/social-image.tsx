/* eslint-disable @next/next/no-img-element */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const SOCIAL_IMAGE_ALT =
  "Invoicely — create proposals, pricing documents, follow-ups, and invoices";

export const SOCIAL_IMAGE_SIZE = {
  width: 1200,
  height: 630,
};

export async function createSocialImage(): Promise<ImageResponse> {
  const logo = await readFile(
    join(process.cwd(), "public", "brand", "invoicely-mark.png"),
    "base64",
  );
  const logoSrc = `data:image/png;base64,${logo}`;

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          background: "#26000d",
          color: "#fff9e8",
          padding: "58px 64px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -310,
            right: -170,
            display: "flex",
            width: 660,
            height: 660,
            border: "86px solid #b20a46",
            borderRadius: 999,
            opacity: 0.42,
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 310,
            bottom: -250,
            display: "flex",
            width: 500,
            height: 500,
            border: "62px solid #f4cf3e",
            borderRadius: 999,
            opacity: 0.12,
          }}
        />

        <div
          style={{
            display: "flex",
            width: "67%",
            height: "100%",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <img
              src={logoSrc}
              alt=""
              width={62}
              height={62}
              style={{ borderRadius: 17 }}
            />
            <div
              style={{
                display: "flex",
                marginLeft: 18,
                fontSize: 40,
                fontWeight: 900,
                letterSpacing: -1.5,
              }}
            >
              Invoicely
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                fontSize: 68,
                fontWeight: 900,
                lineHeight: 1.02,
                letterSpacing: -3.2,
              }}
            >
              <span>Client documents</span>
              <span>that don&apos;t feel like</span>
              <span style={{ color: "#f4cf3e" }}>paperwork.</span>
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 25,
                color: "#f3d8dc",
                fontSize: 24,
                fontWeight: 500,
              }}
            >
              Proposals · Pricing docs · Follow-ups · Invoices
            </div>
          </div>

          <div style={{ display: "flex" }}>
            {["No signup", "AI or manual", "PDF export"].map((label) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  marginRight: 12,
                  border: "1px solid rgba(244, 207, 62, 0.38)",
                  borderRadius: 999,
                  background: "rgba(255, 255, 255, 0.07)",
                  padding: "10px 17px",
                  color: "#ffe985",
                  fontSize: 17,
                  fontWeight: 700,
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            position: "relative",
            display: "flex",
            width: "33%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 70,
              left: 18,
              display: "flex",
              width: 292,
              height: 382,
              border: "2px solid rgba(255, 255, 255, 0.65)",
              borderRadius: 22,
              background: "#c1666b",
              transform: "rotate(-7deg)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 88,
              left: 66,
              display: "flex",
              width: 300,
              height: 390,
              flexDirection: "column",
              overflow: "hidden",
              borderRadius: 22,
              background: "#fffdf5",
              boxShadow: "0 24px 70px rgba(0, 0, 0, 0.36)",
              transform: "rotate(4deg)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#5b001f",
                padding: "24px 25px",
                color: "#fff9e8",
                fontSize: 17,
                fontWeight: 800,
                letterSpacing: 1.5,
              }}
            >
              <span>INVOICE</span>
              <span style={{ color: "#f4cf3e" }}>INV-024</span>
            </div>
            <div
              style={{
                display: "flex",
                flex: 1,
                flexDirection: "column",
                padding: "27px 25px",
                color: "#482832",
              }}
            >
              <div
                style={{
                  display: "flex",
                  marginBottom: 20,
                  fontSize: 23,
                  fontWeight: 800,
                }}
              >
                Ferns &amp; Co.
              </div>
              {[
                ["Strategy workshop", "$750"],
                ["Implementation", "$2,800"],
                ["Launch support", "$650"],
              ].map(([label, amount]) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderBottom: "1px solid #eadde0",
                    padding: "13px 0",
                    fontSize: 15,
                  }}
                >
                  <span>{label}</span>
                  <span style={{ fontWeight: 800 }}>{amount}</span>
                </div>
              ))}
              <div
                style={{
                  display: "flex",
                  marginTop: 22,
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderRadius: 11,
                  background: "#dbeab8",
                  padding: "15px 16px",
                  color: "#17351f",
                  fontSize: 17,
                  fontWeight: 900,
                }}
              >
                <span>Total</span>
                <span>$4,200</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    SOCIAL_IMAGE_SIZE,
  );
}
