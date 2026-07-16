import { Request, Response, NextFunction } from "express";
import { Category } from "../models/Category";
import { ApiError } from "../middleware/errorHandler";

export async function listCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await Category.find().sort("name");
    return res.status(200).json({ categories });
  } catch (err) {
    next(err);
  }
}

export async function createCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, parentCategory, icon } = req.body;
    if (!name) throw new ApiError(400, "name is required");
    const category = await Category.create({ name, parentCategory: parentCategory ?? null, icon });
    return res.status(201).json({ category });
  } catch (err) {
    next(err);
  }
}

export async function deleteCategory(req: Request, res: Response, next: NextFunction) {
  try {
    await Category.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
}
