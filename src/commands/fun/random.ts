import { Command, CommandTypes } from "src/builders/command.builder";

export default new Command({
  data: {
    name: "random",
    description: "Get an random number",
    type: CommandTypes.Fun,
    nsfw: false
  },
  options: [
    {
      type: 10,
      name: "max",
      description: "Maximum random number to obtain",
      required: true,
      minValue: 1
    },
    {
      type: 10,
      name: "min",
      description: "Minimum random number to obtain. Default: 0",
      required: false
    },
    {
      type: 4,
      name: "decimals",
      description: "Decimals to be displayed. Default: 0",
      required: false
    }
  ],
  code: async (ctx) => {
    await ctx.defer();
    const max = ctx.get<number>("max", Number(ctx.args.shift()));
    const min = ctx.get<number>("min", Number(ctx.args.shift()) || 0);
    const decimals = ctx.get<number>("decimals", Math.round(Number(ctx.args.shift()) ?? 0));

    console.log(max, min, decimals);

    if (!max || max < 1) return ctx.send({
      content: "You must give a maximum number equal to or greater than 1, such as 5 for example."
    }, true);
    if (min >= max) return ctx.send({
      content: `Your random number is: ${min}\n-# The minimum is greater than or equal to the maximum, so it will always be this number.`
    });

    ctx.send({
      content: `Your random number is: ${ctx.util.random.number(max, min, decimals)}`
    });
  }
});