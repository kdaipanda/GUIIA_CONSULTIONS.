import { supabase } from "./supabaseClient";

const generateId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export async function createConsultationSupabase({ userId, category, formData }) {
  const now = new Date().toISOString();
  const row = {
    id: generateId(),
    user_id: userId,
    payload: {
      category,
      form_data: formData,
    },
    status: "draft",
    created_at: now,
  };
  const { data, error } = await supabase.from("consultations").insert(row).select().single();
  if (error) throw error;
  return data;
}

export async function listConsultationsSupabase(userId, limit = 50) {
  const { data, error } = await supabase
    .from("consultations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function updateConsultationPayloadSupabase(consultationId, payloadUpdates) {
  const { error } = await supabase
    .from("consultations")
    .update({ payload: payloadUpdates, updated_at: new Date().toISOString() })
    .eq("id", consultationId);
  if (error) throw error;
}

export async function uploadMedicalImageSupabase({ userId, file, imageType = "general", consultationId, patientName, additionalContext }) {
  const fileExt = file.name.split(".").pop() || "jpg";
  const imageId = generateId();
  const path = `user-${userId}/medical-images/${imageId}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("uploads")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(path);
  const publicUrl = urlData?.publicUrl || null;

  const row = {
    id: imageId,
    user_id: userId,
    consultation_id: consultationId || null,
    image_type: imageType,
    patient_name: patientName || null,
    image_url: publicUrl,
    additional_context: additionalContext || null,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from("medical_images").insert(row).select().single();
  if (error) throw error;

  return { image: data, publicUrl };
}

export async function listMedicalImagesSupabase(userId, limit = 20) {
  const { data, error } = await supabase
    .from("medical_images")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}
