export default function qup<C = void, T = void>(f: (context: C) => T | Promise<T>, jobs?: number): {
    push: (context: C) => Promise<T>;
    drain: () => Promise<void>;
};
