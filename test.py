def merge(a, b):
    merged = []
    while(a and b):
        if a[0] < b[0]:
            merged.append(a.pop(0))
        else:
            merged.append(b.pop(0))
    return merged + a + b

def sort(a):
    if len(a) > 1:
        l = len(a)
        h = int(l / 2)
        arr1 = sort(a[:h])
        arr2 = sort(a[h+1:])
        return merge(arr1, arr2)
    return a

print(sort([1, 5, 8, 2, 9, 3, 4]))