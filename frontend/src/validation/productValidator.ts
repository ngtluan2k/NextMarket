// src/validation/productValidator.ts
export type ValidationErrorItem = {
    path: (string | number)[];
    message: string;
  };
  export type ValidationFail = { success: false; error: { errors: ValidationErrorItem[] } };
  export type ValidationSuccess<T> = { success: true; data: T };
  
  type Mode = "publish" | "draft";
  
  /** Helpers */
  const isNonEmptyString = (v: any) => typeof v === "string" && v.trim().length > 0;
  const isNumber = (v: any) => typeof v === "number" && !Number.isNaN(v);
  const isNonNegNumber = (v: any) => isNumber(v) && v >= 0;     // ≥ 0
  const isPosNumber = (v: any) => isNumber(v) && v > 0;          // > 0
  const isInt = (v: any) => Number.isInteger(v);
  const isNonNegInt = (v: any) => isInt(v) && v >= 0;
  const isPosInt = (v: any) => isInt(v) && v >= 1;
  const toTime = (v: any) => (v instanceof Date ? v.getTime() : new Date(v).getTime());
  const startOfToday = () => { const d = new Date(); d.setHours(0,0,0,0); return d.getTime(); };
  
  function E(errors: ValidationErrorItem[], path: (string | number)[], message: string) {
    errors.push({ path, message });
  }
  
  export function validateProduct(form: any, mode: Mode): ValidationSuccess<any> | ValidationFail {
    const errors: ValidationErrorItem[] = [];
    const isDraft = mode === "draft";
  
    if (!isDraft) {
      // Step 1
      if (!isNonEmptyString(form?.name)) {
        E(errors, ["name"], "Tên sản phẩm là bắt buộc");
      }
      // base_price > 0
      if (!isPosNumber(Number(form?.base_price))) {
        E(errors, ["base_price"], "Giá cơ bản phải > 0");
      }
      if (!isInt(Number(form?.brandId)) || Number(form?.brandId) <= 0) {
        E(errors, ["brandId"], "Vui lòng chọn thương hiệu");
      }
      if (!Array.isArray(form?.categories) || form.categories.length === 0) {
        E(errors, ["categories"], "Chọn ít nhất 1 danh mục");
      }
  
      // Step 2
      const cover = form?.media?.[0];
      if (!(cover && (isNonEmptyString(cover.url) || cover.file))) {
        E(errors, ["media", 0, "url"], "Cần có ảnh đại diện (cover)");
      }
  
      // Step 3
      if (!Array.isArray(form?.variants) || form.variants.length === 0) {
        E(errors, ["variants"], "Cần thêm ít nhất 1 biến thể");
      } else {
        form.variants.forEach((v: any, i: number) => {
          if (!isNonEmptyString(v?.sku)) E(errors, ["variants", i, "sku"], "SKU biến thể là bắt buộc");
          if (!isNonEmptyString(v?.variant_name)) E(errors, ["variants", i, "variant_name"], "Tên biến thể là bắt buộc");
          if (!isNonNegNumber(Number(v?.price))) {
            E(errors, ["variants", i, "price"], "Giá biến thể phải ≥ 0");
          }
          if (v?.stock != null && !isNonNegInt(Number(v?.stock))) {
            E(errors, ["variants", i, "stock"], "Tồn kho phải là số nguyên ≥ 0");
          }
        });
      }
  
      const inv = Array.isArray(form?.inventory) ? form.inventory : [];
      inv.forEach((it: any, i: number) => {
        if (!isNonEmptyString(it?.variant_sku)) E(errors, ["inventory", i, "variant_sku"], "SKU biến thể (variant_sku) là bắt buộc");
        if (!isNonEmptyString(it?.location)) E(errors, ["inventory", i, "location"], "Vị trí/kho (location) là bắt buộc");
        if (!isNonNegInt(Number(it?.quantity))) E(errors, ["inventory", i, "quantity"], "Số lượng phải là số nguyên ≥ 0");
      });
  
      // Cross-check inventory with variants
      const variants = Array.isArray(form?.variants) ? form.variants : [];
      const skuSet = new Set(variants.map((v: any) => v?.sku).filter(Boolean));
  
      variants.forEach((v: any) => {
        const sum = inv.filter((i: any) => i?.variant_sku === v?.sku)
                       .reduce((s: number, i: any) => s + Number(i?.quantity || 0), 0);
        if (sum <= 0) {
          E(errors, ["inventory"], `Biến thể "${v?.sku || "(chưa có SKU)"}" phải có tổng tồn kho > 0`);
        }
      });
      inv.forEach((i: any) => {
        if (!skuSet.has(i?.variant_sku)) {
          E(errors, ["inventory"], `Hàng tồn kho có SKU "${i?.variant_sku}" không khớp với bất kỳ biến thể nào`);
        }
      });
  
      // Step 4: Pricing rules
      const rules = Array.isArray(form?.pricing_rules) ? form.pricing_rules : [];
      const todayTs = startOfToday();
  
      rules.forEach((pr: any, idx: number) => {
        if (!isNonEmptyString(pr?.type)) E(errors, ["pricing_rules", idx, "type"], "Loại ưu đãi/bảng giá (type) là bắt buộc");
        if (!isPosInt(Number(pr?.min_quantity))) E(errors, ["pricing_rules", idx, "min_quantity"], "Số lượng tối thiểu phải là số nguyên ≥ 1");
        if (!isNonNegNumber(Number(pr?.price))) E(errors, ["pricing_rules", idx, "price"], "Giá áp dụng phải ≥ 0");
  
        // --- Date validations ---
        const hasStart = !!pr?.starts_at;
        const hasEnd = !!pr?.ends_at;
        const s = hasStart ? toTime(pr.starts_at) : NaN;
        const e = hasEnd ? toTime(pr.ends_at) : NaN;
  
        if (hasStart) {
          if (!Number.isFinite(s)) {
            E(errors, ["pricing_rules", idx, "starts_at"], "Ngày bắt đầu không hợp lệ");
          } else if (s < todayTs) {
            E(errors, ["pricing_rules", idx, "starts_at"], "Ngày bắt đầu không được ở quá khứ");
          }
        }
  
        if (hasEnd) {
          if (!Number.isFinite(e)) {
            E(errors, ["pricing_rules", idx, "ends_at"], "Ngày kết thúc không hợp lệ");
          } else if (e < todayTs) {
            E(errors, ["pricing_rules", idx, "ends_at"], "Ngày kết thúc không được ở quá khứ");
          }
        }
  
        if (hasStart && hasEnd && Number.isFinite(s) && Number.isFinite(e)) {
          if (e < s) {
            E(errors, ["pricing_rules", idx, "ends_at"], "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu");
          }
        }
      });
    }
  
    if (errors.length) return { success: false, error: { errors } };
    return { success: true, data: form };
  }
  
  /** Map lỗi -> object key string để hiển thị dưới field */
  export function mapErrors(errors: ValidationErrorItem[]) {
    const out: Record<string, string> = {};
    for (const e of errors) {
      const key = e.path.join(".");
      if (!out[key]) out[key] = e.message;
    }
    return out;
  }
  
  /** Tìm step đầu tiên có lỗi để auto-jump */
  export function firstErrorStep(keys: string[]) {
    const s1 = ["name", "short_description", "description", "base_price", "brandId", "categories"];
    const s2 = ["media"];
    const s3 = ["variants", "inventory"];
    const s4 = ["pricing_rules"];
  
    const has = (group: string[]) => keys.some(k => group.some(f => k === f || k.startsWith(`${f}.`)));
    if (has(s1)) return 1;
    if (has(s2)) return 2;
    if (has(s3)) return 3;
    if (has(s4)) return 4;
    return 1;
  }
  