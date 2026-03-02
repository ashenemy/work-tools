import mongoose from 'mongoose';

export function mongooseNormalize() {
    const idTransform = (doc: unknown, ret: Record<any, any>) => {
        if (ret._id != null) {
            ret._id = ret._id.toString();
        }

        delete ret.__v;

        return ret;
    };

    mongoose.set('toJSON', {
        virtuals: true, // виртуальные поля тоже попадают
        versionKey: false,
        transform: idTransform,
    });

    mongoose.set('toObject', {
        virtuals: true,
        versionKey: false,
        transform: idTransform,
    });
}



