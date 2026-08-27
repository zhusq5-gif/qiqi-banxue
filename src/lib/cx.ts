/** className 拼接工具（避免模板字符串） */
export function cx(...args: Array<string | false | null | undefined>): string {
  return args.filter(Boolean).join(' ')
}
