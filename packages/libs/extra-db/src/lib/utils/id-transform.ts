export const idTransform = (doc: unknown, ret: Record<any, unknown>) => {
    if (ret._id != null) {
        ret._id = ret._id.toString();
    }

    delete ret.__v;

    return ret;
};
