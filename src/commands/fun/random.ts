import { Command, CommandTypes } from "src/builders/command.builder";

export default new Command({
  data: {
    name: "random",
    description: "Get an random number",
    type: CommandTypes.Fun,
    nsfw: false
  },
  code: async () => { }
});