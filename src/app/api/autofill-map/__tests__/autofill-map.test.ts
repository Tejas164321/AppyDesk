import { describe, it, expect } from "vitest";
import { POST } from "../route";
import { NextRequest } from "next/server";

describe("POST /api/autofill-map", () => {
  it("returns 400 error when no fields are provided", async () => {
    const req = new NextRequest("http://localhost:3000/api/autofill-map", {
      method: "POST",
      body: JSON.stringify({ fields: [] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("No field descriptors");
  });

  it("returns 401 when token authentication fails with invalid token", async () => {
    const req = new NextRequest("http://localhost:3000/api/autofill-map", {
      method: "POST",
      headers: { Authorization: "Bearer adk_invalid_token_xyz" },
      body: JSON.stringify({
        fields: [{ fieldId: "f1", type: "text", label: "Full Name" }],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain("token");
  });

  it("correctly maps standard profile fields and leaves unmapped fields blank", async () => {
    const req = new NextRequest("http://localhost:3000/api/autofill-map", {
      method: "POST",
      body: JSON.stringify({
        uid: "test_user_1",
        fields: [
          { fieldId: "f1", type: "text", label: "First Name", id: "first_name" },
          { fieldId: "f2", type: "email", label: "Email Address", id: "email" },
          { fieldId: "f3", type: "text", label: "LinkedIn Profile", name: "linkedin" },
          { fieldId: "f4", type: "textarea", label: "Why do you want to work here?" },
          { fieldId: "f5", type: "text", label: "Expected Annual Salary ($)" },
        ],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.totalDetected).toBe(5);

    const f1 = data.mappings.find((m: any) => m.fieldId === "f1");
    expect(f1.value).toBe("Tejas");
    expect(f1.isDraft).toBe(false);

    const f2 = data.mappings.find((m: any) => m.fieldId === "f2");
    expect(f2.value).toBe("tejaspatil1643@gmail.com");

    const f4 = data.mappings.find((m: any) => m.fieldId === "f4");
    expect(f4.isDraft).toBe(true);
    expect(f4.value).toContain("excited");

    const f5 = data.mappings.find((m: any) => m.fieldId === "f5");
    expect(f5.value).toBeNull();
    expect(f5.isUnmapped).toBe(true);
  });
});
